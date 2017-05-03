/**
 * Copyright 2017, Optimizely
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var audienceEvaluator = require('../audience_evaluator');
var bucketer = require('../bucketer');
var enums = require('../../utils/enums');
var fns = require('../../utils/fns');
var projectConfig = require('../project_config');

var sprintf = require('sprintf');

var MODULE_NAME = 'DECISION_SERVICE';
var ERROR_MESSAGES = enums.ERROR_MESSAGES;
var LOG_LEVEL = enums.LOG_LEVEL;
var LOG_MESSAGES = enums.LOG_MESSAGES;

/**
 * [DecisionService description]
 * @param {[type]} options [description]
 */
function DecisionService(options) {
  this.configObj = options.configObj;
  this.logger = options.logger;
}

/**
 * Gets variation where visitor will be bucketed.
 * @param  {string}      experimentKey
 * @param  {string}      userId
 * @param  {Object}      attributes
 * @return {string|null} the active variation
 */
DecisionService.prototype.getVariation = function(experimentKey, userId, attributes) {
  if (!this.__checkIfExperimentIsActive(experimentKey, userId)) {
    return null;
  }

  var variationId = this.__getWhitelistedVariation(experimentKey, userId);
  if (!variationId) {
    if (!this.__checkIfUserIsInAudience(experimentKey, userId, attributes)) {
      return null;
    }
    var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
    variationId = bucketer.bucket(bucketerParams);
  }

  return projectConfig.getVariationKeyFromId(this.configObj, variationId);
};

/**
 * Checks whether the experiment is running or launched
 * @param  {string}  experimentKey Key of experiment being validated
 * @param  {string}  userId        ID of user
 * @return {boolean} True if experiment is running
 */
DecisionService.prototype.__checkIfExperimentIsActive = function(experimentKey, userId) {
  if (!projectConfig.isActive(this.configObj, experimentKey)) {
    var experimentNotRunningLogMessage = sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, MODULE_NAME, experimentKey);
    this.logger.log(LOG_LEVEL.INFO, experimentNotRunningLogMessage);
    return false;
  }

  return true;
};

/**
 * Checks if user is whitelisted into any variation and return that variation if so
 * @param  experimentKey
 * @param  userId
 * @return {string|null} Forced variation if it exists for user ID, otherwise null
 */
DecisionService.prototype.__getWhitelistedVariation = function(experimentKey, userId) {
  var experiment = this.configObj.experimentKeyMap[experimentKey];

  if (fns.isEmpty(experiment)) {
    throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
  }

  if (!fns.isEmpty(experiment.forcedVariations) && experiment.forcedVariations.hasOwnProperty(userId)) {
    var forcedVariationKey = experiment.forcedVariations[userId];
    var experimentVariationKey = experimentKey + forcedVariationKey;
    if (this.configObj.experimentVariationKeyMap.hasOwnProperty(experimentVariationKey)) {
      var forcedBucketingSucceededMessageLog = sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, MODULE_NAME, userId, forcedVariationKey);
      this.logger.log(LOG_LEVEL.INFO, forcedBucketingSucceededMessageLog);
      return this.configObj.experimentVariationKeyMap[experimentVariationKey].id;
    } else {
      var forcedBucketingFailedMessageLog = sprintf(LOG_MESSAGES.FORCED_BUCKETING_FAILED, MODULE_NAME, forcedVariationKey, userId);
      this.logger.log(LOG_LEVEL.ERROR, forcedBucketingFailedMessageLog);
      return null;
    }
  }

  return null;
};

/**
 * Checks whether the user is included in experiment audience
 * @param  {string}  experimentKey Key of experiment being validated
 * @param  {string}  userId        ID of user
 * @param  {Object}  attributes    Optional parameter for user's attributes
 * @return {boolean} True if user meets audience conditions
 */
DecisionService.prototype.__checkIfUserIsInAudience = function(experimentKey, userId, attributes) {
  var audiences = projectConfig.getAudiencesForExperiment(this.configObj, experimentKey);
  if (!audienceEvaluator.evaluate(audiences, attributes)) {
    var userDoesNotMeetConditionsLogMessage = sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, MODULE_NAME, userId, experimentKey);
    this.logger.log(LOG_LEVEL.INFO, userDoesNotMeetConditionsLogMessage);
    return false;
  }

  return true;
};

/**
 * Given an experiment key and user ID, returns params used in bucketer call
 * @param  experimentKey Experiment key used for bucketer
 * @param  userId        ID of user to be bucketed
 * @return {Object}
 */
DecisionService.prototype.__buildBucketerParams = function(experimentKey, userId) {
  var bucketerParams = {};
  bucketerParams.experimentKey = experimentKey;
  bucketerParams.experimentId = projectConfig.getExperimentId(this.configObj, experimentKey);
  bucketerParams.userId = userId;
  bucketerParams.trafficAllocationConfig = projectConfig.getTrafficAllocation(this.configObj, experimentKey);
  bucketerParams.experimentKeyMap = this.configObj.experimentKeyMap;
  bucketerParams.groupIdMap = this.configObj.groupIdMap;
  bucketerParams.experimentVariationKeyMap = this.configObj.experimentVariationKeyMap;
  bucketerParams.variationIdMap = this.configObj.variationIdMap;
  bucketerParams.logger = this.logger;
  return bucketerParams;
};

module.exports = {
  /**
   * Creates an instance of the DecisionService.
   * @param  {Object} options               Configuration options
   * @param  {Object} options.projectConfig
   * @param  {Object} options.logger
   * @return {Object} An instance of the DecisionService
   */
  createDecisionService: function(options) {
    return new DecisionService(options);
  },
};
