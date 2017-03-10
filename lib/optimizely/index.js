/**
 * Copyright 2016-2017, Optimizely
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
var _ = require('lodash/core');
var attributesValidator = require('../utils/attributes_validator');
var audienceEvaluator = require('../core/audience_evaluator');
var bucketer = require('../core/bucketer');
var enums = require('../utils/enums');
var eventBuilder = require('../core/event_builder');
var eventTagsValidator = require('../utils/event_tags_validator');
var jsonSchemaValidator = require('../utils/json_schema_validator');
var projectConfig = require('../core/project_config');
var projectConfigSchema = require('./project_config_schema');
var sprintf = require('sprintf');
var userIdValidator = require('../utils/user_id_validator');

var ERROR_MESSAGES = enums.ERROR_MESSAGES;
var LOG_LEVEL = enums.LOG_LEVEL;
var LOG_MESSAGES = enums.LOG_MESSAGES;
var MODULE_NAME = 'OPTIMIZELY';

/**
 * The Optimizely class
 * @param {Object} config
 * @param {string} config.clientEngine
 * @param {string} config.clientVersion
 * @param {Object} config.datafile
 * @param {Object} config.errorHandler
 * @param {Object} config.eventDispatcher
 * @param {Object} config.logger
 */
function Optimizely(config) {
  var clientEngine = config.clientEngine;
  if (clientEngine !== enums.NODE_CLIENT_ENGINE && clientEngine !== enums.JAVASCRIPT_CLIENT_ENGINE) {
    config.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.INVALID_CLIENT_ENGINE, MODULE_NAME, clientEngine));
    clientEngine = enums.NODE_CLIENT_ENGINE;
  }

  this.clientEngine = clientEngine;
  this.clientVersion = config.clientVersion || enums.NODE_CLIENT_VERSION;
  this.errorHandler = config.errorHandler;
  this.eventDispatcher = config.eventDispatcher;
  this.isValidInstance = config.isValidInstance;
  this.logger = config.logger;

  if (!config.datafile) {
    this.logger.log(LOG_LEVEL.ERROR, sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, MODULE_NAME));
    this.errorHandler.handleError(new Error(sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, MODULE_NAME)));
    this.isValidInstance = false;
  } else {
    if (config.skipJSONValidation === true) {
      this.configObj = projectConfig.createProjectConfig(config.datafile);
      this.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.SKIPPING_JSON_VALIDATION, MODULE_NAME));
    } else {
      try {
        var projectConfigSchemaVersion = config.datafile.version === enums.NEW_OPTIMIZELY_VERSION ?
          projectConfigSchema.V2 : projectConfigSchema.V1;
        if (jsonSchemaValidator.validate(projectConfigSchemaVersion, config.datafile)) {
          this.configObj = projectConfig.createProjectConfig(config.datafile);
          this.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.VALID_DATAFILE, MODULE_NAME));
        }
      } catch (ex) {
        this.isValidInstance = false;
        this.logger.log(LOG_LEVEL.ERROR, ex.message);
        this.errorHandler.handleError(ex);
      }
    }
  }
}

/**
 * Buckets visitor and sends impression event to Optimizely.
 * @param  {string}      experimentKey
 * @param  {string}      userId
 * @param  {Object}      attributes
 * @return {string|null}
 */
Optimizely.prototype.activate = function(experimentKey, userId, attributes) {
  if (!this.isValidInstance) {
    this.logger.log(LOG_LEVEL.ERROR, sprintf(LOG_MESSAGES.INVALID_OBJECT, MODULE_NAME, 'activate'));
    return null;
  }

  try {
    if (!this.__validateInputs(userId, attributes) || !this.__checkIfExperimentIsActive(experimentKey, userId)) {
      return this.__notActivatingExperiment(experimentKey, userId);
    }

    var variationId = this.__returnForcedVariationIdIfProvided(experimentKey, userId);
    if (!variationId) {
      if (!this.__checkIfUserIsInAudience(experimentKey, userId, attributes)) {
        return this.__notActivatingExperiment(experimentKey, userId);
      }

      var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
      variationId = bucketer.bucket(bucketerParams);
    }

    var variationKey = projectConfig.getVariationKeyFromId(this.configObj, experimentKey, variationId);


    // If experiment is not set to 'Running' status, log accordingly and return variation key
    if (!projectConfig.isRunning(this.configObj, experimentKey)) {
      var shouldNotDispatchActivateLogMessage = sprintf(LOG_MESSAGES.SHOULD_NOT_DISPATCH_ACTIVATE, MODULE_NAME, experimentKey);
      this.logger.log(LOG_LEVEL.DEBUG, shouldNotDispatchActivateLogMessage);
      return variationKey;
    }

    if (variationId === null) {
      var failedActivationLogMessage = sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, MODULE_NAME, userId, experimentKey);
      this.logger.log(LOG_LEVEL.INFO, failedActivationLogMessage);
      return null;
    }

    var impressionEventOptions = {
      attributes: attributes,
      clientEngine: this.clientEngine,
      clientVersion: this.clientVersion,
      configObj: this.configObj,
      experimentKey: experimentKey,
      userId: userId,
      variationId: variationId,
    };
    var impressionEvent = eventBuilder.getImpressionEvent(impressionEventOptions);

    var dispatchedImpressionEventLogMessage = sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                                      MODULE_NAME,
                                                      impressionEvent.url,
                                                      JSON.stringify(impressionEvent.params));
    this.logger.log(LOG_LEVEL.DEBUG, dispatchedImpressionEventLogMessage);
    this.eventDispatcher.dispatchEvent(impressionEvent)
      .then(function() {
        var activatedLogMessage = sprintf(LOG_MESSAGES.ACTIVATE_USER, MODULE_NAME, userId, experimentKey);
        this.logger.log(LOG_LEVEL.INFO, activatedLogMessage);
      }.bind(this));
    return variationKey;
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, ex.message);
    var failedActivationLogMessage = sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, MODULE_NAME, userId, experimentKey);
    this.logger.log(LOG_LEVEL.INFO, failedActivationLogMessage);
    this.errorHandler.handleError(ex);
    return null;
  }
};

/**
 * Sends conversion event to Optimizely.
 * @param  {string} eventKey
 * @param  {string} userId
 * @param  {string} attributes
 * @param  {Object} eventTags Values associated with the event.
 */
Optimizely.prototype.track = function(eventKey, userId, attributes, eventTags) {
  if (!this.isValidInstance) {
    this.logger.log(LOG_LEVEL.ERROR, sprintf(LOG_MESSAGES.INVALID_OBJECT, MODULE_NAME, 'track'));
    return;
  }

  // The value passed as eventTags is a number, so we consider it is a deprecated revenue parameter.
  if (typeof eventTags === 'number' && isFinite(eventTags)) {
    this.logger.log(LOG_LEVEL.WARNING, sprintf(LOG_MESSAGES.DEPRECATED_EVENT_VALUE, MODULE_NAME, 'track'))
    eventTags = {
      'revenue': eventTags,
    };
  }

  try {
    if (!this.__validateInputs(userId, attributes, eventTags)) {
      return;
    }

    var experimentIdsForEvent = projectConfig.getExperimentIdsForEvent(this.configObj, eventKey);
    if (!experimentIdsForEvent) {
      this.logger.log(LOG_LEVEL.WARNING, sprintf(LOG_MESSAGES.EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS,
                                                 MODULE_NAME,
                                                 eventKey));
      return;
    }

    var validExperimentInformationForEvent = this.__getValidExperimentInformationForEvent(eventKey, userId, attributes);
    var validExperimentKeysForEvent = validExperimentInformationForEvent.validExperimentKeysForEvent;
    if (!validExperimentKeysForEvent.length) {
      var noValidExperimentsForEventToTrack = sprintf(LOG_MESSAGES.NO_VALID_EXPERIMENTS_FOR_EVENT_TO_TRACK,
                                                      MODULE_NAME,
                                                      eventKey);
      this.logger.log(LOG_LEVEL.INFO, noValidExperimentsForEventToTrack);
      return;
    }

    var variationIds = this.__getBucketedVariationIdsForUser(validExperimentInformationForEvent, userId);

    // Return and do not send conversion events if user is not bucketed into any variations
    var variationIdsAreNull = _.every(variationIds, _.isNull);
    if (variationIdsAreNull) {
      var failedTrackLogMessage = sprintf(LOG_MESSAGES.NOT_TRACKING_USER, MODULE_NAME, userId);
      this.logger.log(LOG_LEVEL.INFO, failedTrackLogMessage);
      return;
    }

    var conversionEventOptions = {
      attributes: attributes,
      clientEngine: this.clientEngine,
      clientVersion: this.clientVersion,
      configObj: this.configObj,
      eventKey: eventKey,
      eventTags: eventTags,
      userId: userId,
      validExperimentKeysForEvent: validExperimentKeysForEvent,
      variationIds: variationIds,
    };
    var conversionEvent = eventBuilder.getConversionEvent(conversionEventOptions);

    var dispatchedConversionEventLogMessage = sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                                      MODULE_NAME,
                                                      conversionEvent.url,
                                                      JSON.stringify(conversionEvent.params));
    this.logger.log(LOG_LEVEL.DEBUG, dispatchedConversionEventLogMessage);
    this.eventDispatcher.dispatchEvent(conversionEvent)
      .then(function() {
        var trackedLogMessage = sprintf(LOG_MESSAGES.TRACK_EVENT, MODULE_NAME, eventKey, userId);
        this.logger.log(LOG_LEVEL.INFO, trackedLogMessage);
      }.bind(this));
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, ex.message);
    var failedTrackLogMessage = sprintf(LOG_MESSAGES.NOT_TRACKING_USER, MODULE_NAME, userId);
    this.logger.log(LOG_LEVEL.INFO, failedTrackLogMessage);
    this.errorHandler.handleError(ex);
  }
};

/**
 * Gets variation where visitor will be bucketed.
 * @param  {string}      experimentKey
 * @param  {string}      userId
 * @param  {Object}      attributes
 * @return {string|null} the active variation
 */
Optimizely.prototype.getVariation = function(experimentKey, userId, attributes) {
  if (!this.isValidInstance) {
    this.logger.log(LOG_LEVEL.ERROR, sprintf(LOG_MESSAGES.INVALID_OBJECT, MODULE_NAME, 'getVariation'));
    return null;
  }

  try {
    if (!this.__validateInputs(userId, attributes) || !this.__checkIfExperimentIsActive(experimentKey, userId)) {
      return null;
    }

    var variationId = this.__returnForcedVariationIdIfProvided(experimentKey, userId);
    if (!variationId) {
      if (!this.__checkIfUserIsInAudience(experimentKey, userId, attributes)) {
        return null;
      }
      var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
      variationId = bucketer.bucket(bucketerParams);
    }

    return projectConfig.getVariationKeyFromId(this.configObj, experimentKey, variationId);
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, ex.message);
    this.errorHandler.handleError(ex);
    return null;
  }
};

/**
 * Given event key, user ID, and attributes, returns experiment keys that are valid in tracking the event
 * @param  {string} eventKey   Event key being tracked
 * @param  {string} userId     ID of user
 * @param  {Object} attributes Optional parameter for user's attributes
 * @return {Object<string>}    Object consisting of valid experiment keys for event and experiment key to forced variation ID map
 */
Optimizely.prototype.__getValidExperimentInformationForEvent = function(eventKey, userId, attributes) {
  var validExperimentKeysForEvent = [];
  var experimentKeyToForcedVariationIdMap = {};

  if (this.configObj.eventKeyMap[eventKey]) {
    var experimentKey;
    _.forEach(this.configObj.eventKeyMap[eventKey].experimentIds, function(experimentId) {
      experimentKey = this.configObj.experimentIdMap[experimentId].key;

      if (!this.__checkIfExperimentIsActive(experimentKey, userId)) {
        var failedTrackLogMessage = sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT,
                                              MODULE_NAME,
                                              userId,
                                              experimentKey);
        this.logger.log(LOG_LEVEL.INFO, failedTrackLogMessage);
        return;
      }

      var forcedVariationId = this.__returnForcedVariationIdIfProvided(experimentKey, userId);
      if (forcedVariationId) {
        validExperimentKeysForEvent.push(experimentKey);
        experimentKeyToForcedVariationIdMap[experimentKey] = forcedVariationId;
      } else {
        // If user is not in audience for the experiment or experiment is not running, do not push experiment ID into validExperimentKeysForEvent
        if (!this.__checkIfUserIsInAudience(experimentKey, userId, attributes)) {
          var failedTrackLogMessage = sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT,
                                              MODULE_NAME,
                                              userId,
                                              experimentKey);
          this.logger.log(LOG_LEVEL.INFO, failedTrackLogMessage);
        } else {
          // If experiment is not set to 'Running' status, log accordingly
          if (!projectConfig.isRunning(this.configObj, experimentKey)) {
            var shouldNotDispatchTrackLogMessage = sprintf(LOG_MESSAGES.SHOULD_NOT_DISPATCH_TRACK, MODULE_NAME, experimentKey);
            this.logger.log(LOG_LEVEL.DEBUG, shouldNotDispatchTrackLogMessage);
          } else {
            validExperimentKeysForEvent.push(experimentKey);
          }
        }
      }
    }.bind(this));
  }

  return {
    validExperimentKeysForEvent: validExperimentKeysForEvent,
    experimentKeyToForcedVariationIdMap: experimentKeyToForcedVariationIdMap,
  };
};

/**
 * Given a user ID and an array of valid experiments, returns variation IDs that a user gets bucketed into
 * @param {Object<string>} validExperimentInformation Object consisting of valid experiment keys for event and experiment key to forced variation ID map
 * @param {string}         userId                     ID of user
 * @return {Array<string>}
 */
Optimizely.prototype.__getBucketedVariationIdsForUser = function(validExperimentInformation, userId) {
  try {
    var validExperimentKeys = validExperimentInformation.validExperimentKeysForEvent;
    var experimentKeyToForcedVariationIdMap = validExperimentInformation.experimentKeyToForcedVariationIdMap;

    var variationIds = _.map(validExperimentKeys, function(experimentKey) {
      var variationId = experimentKeyToForcedVariationIdMap[experimentKey];
      if (!variationId) {
        var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
        return bucketer.bucket(bucketerParams);
      } else {
        return variationId;
      }
    }.bind(this));

    return variationIds;
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, ex.message);
    this.errorHandler.handleError(ex);
    return null;
  }
};

/**
 * Validates user ID and attributes parameters
 * @param  {string}  userId         ID of user
 * @param  {Object}  userAttributes Optional parameter for user's attributes
 * @param  {Object}  eventTags      Optional parameter for event tags
 * @return {boolean} True if inputs are valid
 *
 */
Optimizely.prototype.__validateInputs = function(userId, userAttributes, eventTags) {
  try {
    userIdValidator.validate(userId);
    if (userAttributes) {
      attributesValidator.validate(userAttributes);
    }
    if (eventTags) {
      eventTagsValidator.validate(eventTags);
    }
    return true;
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, ex.message);
    this.errorHandler.handleError(ex);
    return false;
  }
};

/**
 * Checks whether the experiment is running or launched
 * @param  {string}  experimentKey Key of experiment being validated
 * @param  {string}  userId        ID of user
 * @return {boolean} True if experiment is running
 */
Optimizely.prototype.__checkIfExperimentIsActive = function(experimentKey, userId) {
  if (!projectConfig.isActive(this.configObj, experimentKey)) {
    var experimentNotRunningLogMessage = sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, MODULE_NAME, experimentKey);
    this.logger.log(LOG_LEVEL.INFO, experimentNotRunningLogMessage);
    return false;
  }

  return true;
};

/**
 * Checks if forced variation is provided
 * @param  experimentKey
 * @param  userId
 * @return {string|null} Forced variation if it exists for user ID, otherwise null
 */
Optimizely.prototype.__returnForcedVariationIdIfProvided = function(experimentKey, userId) {
  var experiment = this.configObj.experimentKeyMap[experimentKey];

  if (_.isEmpty(experiment)) {
    throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
  }

  if (!_.isEmpty(experiment.forcedVariations) && experiment.forcedVariations.hasOwnProperty(userId)) {
    return bucketer.forcedBucket(userId,
                                 experiment.forcedVariations,
                                 experimentKey,
                                 this.configObj.experimentVariationKeyMap,
                                 this.logger);
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
Optimizely.prototype.__checkIfUserIsInAudience = function(experimentKey, userId, attributes) {
  var audiences = projectConfig.getAudiencesForExperiment(this.configObj, experimentKey);
  if (!audienceEvaluator.evaluate(audiences, attributes)) {
    var userDoesNotMeetConditionsLogMessage = sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, MODULE_NAME, userId, experimentKey);
    this.logger.log(LOG_LEVEL.INFO, userDoesNotMeetConditionsLogMessage);
    return false;
  }

  return true;
};

/**
 * Shows failed activation log message and returns null when user is not activated in experiment
 * @param  experimentKey
 * @param  userId
 * @return {null}
 */
Optimizely.prototype.__notActivatingExperiment = function(experimentKey, userId) {
  var failedActivationLogMessage = sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, MODULE_NAME, userId, experimentKey);
  this.logger.log(LOG_LEVEL.INFO, failedActivationLogMessage);
  return null;
};

/**
 * Given an experiment key and user ID, returns params used in bucketer call
 * @param  experimentKey Experiment key used for bucketer
 * @param  userId        ID of user to be bucketed
 * @return {Object}
 */
Optimizely.prototype.__buildBucketerParams = function(experimentKey, userId) {
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

module.exports = Optimizely;
