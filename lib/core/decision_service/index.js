/****************************************************************************
 * Copyright 2017, Optimizely, Inc. and contributors                        *
 *                                                                          *
 * Licensed under the Apache License, Version 2.0 (the "License");          *
 * you may not use this file except in compliance with the License.         *
 * You may obtain a copy of the License at                                  *
 *                                                                          *
 *    http://www.apache.org/licenses/LICENSE-2.0                            *
 *                                                                          *
 * Unless required by applicable law or agreed to in writing, software      *
 * distributed under the License is distributed on an "AS IS" BASIS,        *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. *
 * See the License for the specific language governing permissions and      *
 * limitations under the License.                                           *
 ***************************************************************************/

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
 * Optimizely's decision service that determines which variation of an experiment the user will be allocated to.
 *
 * The decision service contains all logic around how a user decision is made. This includes all of the following (in order):
 *   1. Checking experiment status
 *   2. Checking forced bucketing
 *   3. Checking whitelisting
 *   4. Checking user profile service for past bucketing decisions (sticky bucketing)
 *   5. Checking audience targeting
 *   6. Using Murmurhash3 to bucket the user.
 *
 * @constructor
 * @param   {Object} options
 * @param   {Object} options.configObj          The parsed project configuration object that contains all the experiment configurations.
 * @param   {Object} options.userProfileService An instance of the user profile service for sticky bucketing.
 * @param   {Object} options.logger             An instance of a logger to log messages with.
 * @returns {Object}
 */
function DecisionService(options) {
  this.configObj = options.configObj;
  this.userProfileService = options.userProfileService || null;
  this.logger = options.logger;
}

/**
 * Gets variation where visitor will be bucketed.
 * @param  {string}      experimentKey
 * @param  {string}      userId
 * @param  {Object}      attributes
 * @return {string|null} the variation the user is bucketed into.
 */
DecisionService.prototype.getVariation = function(experimentKey, userId, attributes) {
  if (!this.__checkIfExperimentIsActive(experimentKey, userId)) {
    return null;
  }
  var experiment = this.configObj.experimentKeyMap[experimentKey];

  var forcedVariationKey = projectConfig.getForcedVariation(this.configObj, experimentKey, userId, this.logger);
  if (!!forcedVariationKey) {
    return forcedVariationKey;
  }

  var variation = this.__getWhitelistedVariation(experiment, userId);
  if (!!variation) {
    return variation.key;
  }

  // check for sticky bucketing
  var userProfile = this.__getUserProfile(userId);
  variation = this.__getStoredVariation(experiment, userProfile);
  if (!!variation) {
    this.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.RETURNING_STORED_VARIATION, MODULE_NAME, variation.key, experimentKey, userId));
    return variation.key;
  }

  // Perform regular targeting and bucketing
  if (!this.__checkIfUserIsInAudience(experimentKey, userId, attributes)) {
    return null;
  }
  var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
  var variationId = bucketer.bucket(bucketerParams);
  variation = this.configObj.variationIdMap[variationId];
  if (!variation) {
    return null;
  }

  // persist bucketing
  this.__saveUserProfile(userProfile, experiment, variation);

  return variation.key;
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
 * @param  {Object} experiment
 * @param  {string} userId
 * @return {string|null} Forced variation if it exists for user ID, otherwise null
 */
DecisionService.prototype.__getWhitelistedVariation = function(experiment, userId) {
  if (!fns.isEmpty(experiment.forcedVariations) && experiment.forcedVariations.hasOwnProperty(userId)) {
    var forcedVariationKey = experiment.forcedVariations[userId];
    if (experiment.variationKeyMap.hasOwnProperty(forcedVariationKey)) {
      var forcedBucketingSucceededMessageLog = sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, MODULE_NAME, userId, forcedVariationKey);
      this.logger.log(LOG_LEVEL.INFO, forcedBucketingSucceededMessageLog);
      return experiment.variationKeyMap[forcedVariationKey];
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
  bucketerParams.variationIdMap = this.configObj.variationIdMap;
  bucketerParams.logger = this.logger;
  return bucketerParams;
};

/**
 * Get the stored variation from the user profile for the given experiment
 * @param  {Object} experiment
 * @param  {Object} userProfile
 * @return {Object} the stored variation or null if the user profile does not have one for the given experiment
 */
DecisionService.prototype.__getStoredVariation = function(experiment, userProfile) {
  if (!userProfile || !userProfile.experiment_bucket_map) {
    return null;
  }

  if (userProfile.experiment_bucket_map.hasOwnProperty(experiment.id)) {
    var decision = userProfile.experiment_bucket_map[experiment.id];
    var variationId = decision.variation_id;
    if (this.configObj.variationIdMap.hasOwnProperty(variationId)) {
      return this.configObj.variationIdMap[decision.variation_id];
    } else {
      this.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.SAVED_VARIATION_NOT_FOUND, MODULE_NAME, userProfile.user_id, variationId, experiment.key));
    }
  }

  return null;
};

/**
 * Get the user profile with the given user ID
 * @param  {string} userId
 * @return {Object} the stored user profile or an empty one if not found
 */
DecisionService.prototype.__getUserProfile = function(userId) {
  var userProfile = {
    user_id: userId,
    experiment_bucket_map: {},
  };

  if (!this.userProfileService) {
    return userProfile;
  }

  try {
    userProfile = this.userProfileService.lookup(userId) || userProfile; // only assign if the lookup is successful
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, sprintf(ERROR_MESSAGES.USER_PROFILE_LOOKUP_ERROR, MODULE_NAME, userId, ex.message));
  }
  return userProfile;
};

/**
 * Saves the bucketing decision to the user profile
 * @param {Object} userProfile
 * @param {Object} experiment
 * @param {Object} variation
 */
DecisionService.prototype.__saveUserProfile = function(userProfile, experiment, variation) {
  if (!this.userProfileService) {
    return;
  }

  try {
    userProfile.experiment_bucket_map[experiment.id] = {
      variation_id: variation.id,
    };

    this.userProfileService.save(userProfile);
    this.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.SAVED_VARIATION, MODULE_NAME, variation.key, experiment.key, userProfile.user_id));
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, sprintf(ERROR_MESSAGES.USER_PROFILE_SAVE_ERROR, MODULE_NAME, userProfile.user_id, ex.message));
  }
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
