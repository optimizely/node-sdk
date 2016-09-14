var _ = require('lodash/core');
var attributesValidator = require('../utils/attributes_validator');
var audienceEvaluator = require('../core/audience_evaluator');
var bucketer = require('../core/bucketer');
var enums = require('../utils/enums');
var eventBuilder = require('../core/event_builder');
var jsonSchemaValidator = require('../utils/json_schema_validator');
var projectConfig = require('../core/project_config');
var projectConfigSchema = require('./project_config_schema');
var sprintf = require('sprintf');
var userIdValidator = require('../utils/user_id_validator');

var ERROR_MESSAGES = enums.ERROR_MESSAGES;
var LOG_LEVEL = enums.LOG_LEVEL;
var LOG_MESSAGES = enums.LOG_MESSAGES;
var MODULE_NAME = 'OPTIMIZELY';
var NEW_OPTIMIZELY_VERSION = '2';

/**
 * The Optimizely class
 * @param {Object} config
 * @param {Object} config.datafile
 * @param {Object} config.errorHandler
 * @param {Object} config.eventDispatcher
 * @param {Object} config.logger
 */
function Optimizely(config) {
  this.logger = config.logger;
  this.eventDispatcher = config.eventDispatcher;
  this.errorHandler = config.errorHandler;

  if (!config.datafile) {
    this.logger.log(LOG_LEVEL.ERROR, sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, MODULE_NAME));
    this.errorHandler.handleError(new Error(sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, MODULE_NAME)));
  } else {
    if (config.skipJSONValidation === true) {
      this.configObj = projectConfig.createProjectConfig(config.datafile);
      this.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.VALID_DATAFILE, MODULE_NAME));
    } else {
      try {
        var projectConfigSchemaVersion = config.datafile.version === NEW_OPTIMIZELY_VERSION ?
          projectConfigSchema.V2 : projectConfigSchema.V1;
        if (jsonSchemaValidator.validate(projectConfigSchemaVersion, config.datafile)) {
          this.configObj = projectConfig.createProjectConfig(config.datafile);
          this.logger.log(LOG_LEVEL.INFO, sprintf(LOG_MESSAGES.VALID_DATAFILE, MODULE_NAME));
        }
      } catch (ex) {
        this.logger.log(LOG_LEVEL.ERROR, ex.message);
        this.errorHandler.handleError(ex);
      }
    }
  }
}

/**
 * Buckets visitor and sends impression event to Optimizely.
 * @param  {string} experimentKey
 * @param  {string} userId
 * @param  {Object} attributes
 * @return {string}
 */
Optimizely.prototype.activate = function(experimentKey, userId, attributes) {
  try {
    if (!this.__validateInputs(userId, attributes) || !this.__validatePreconditions(experimentKey, userId, attributes)) {
      var failedActivationLogMessage = sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, MODULE_NAME, userId, experimentKey);
      this.logger.log(LOG_LEVEL.INFO, failedActivationLogMessage);
      return null;
    }

    var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
    var variationId = bucketer.bucket(bucketerParams);
    if (variationId === null) {
      var failedActivationLogMessage = sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, MODULE_NAME, userId, experimentKey);
      this.logger.log(LOG_LEVEL.INFO, failedActivationLogMessage);
      return null;
    }

    var impressionEventOptions = {
      configObj: this.configObj,
      experimentKey: experimentKey,
      variationId: variationId,
      userId: userId,
      attributes: attributes,
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
    var variationKey = projectConfig.getVariationKeyFromId(this.configObj, experimentKey, variationId);
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
 * @param  {string} eventValue
 */
Optimizely.prototype.track = function(eventKey, userId, attributes, eventValue) {
  try {
    if (!this.__validateInputs(userId, attributes)) {
      return;
    }

    var experimentIdsForEvent = projectConfig.getExperimentIdsForEvent(this.configObj, eventKey);
    if (!experimentIdsForEvent) {
      this.logger.log(LOG_LEVEL.WARNING, sprintf(LOG_MESSAGES.EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS,
                                                 MODULE_NAME,
                                                 eventKey));
      return;
    }

    var validExperimentEntitiesForEvent = this.__getValidExperimentEntitiesForEvent(eventKey, userId, attributes);
    var validExperimentIdsForEvent = validExperimentEntitiesForEvent.validExperimentIdsForEvent;
    var validExperimentKeysForEvent = validExperimentEntitiesForEvent.validExperimentKeysForEvent;
    if (!validExperimentIdsForEvent.length) {
      var noValidExperimentsForEventToTrack = sprintf(LOG_MESSAGES.NO_VALID_EXPERIMENTS_FOR_EVENT_TO_TRACK,
                                                      MODULE_NAME,
                                                      eventKey);
      this.logger.log(LOG_LEVEL.INFO, noValidExperimentsForEventToTrack);
      return;
    }

    var variationIds = this.__getBucketedVariationIdsForUser(validExperimentIdsForEvent, userId);

    var conversionEventOptions = {
      configObj: this.configObj,
      eventKey: eventKey,
      userId: userId,
      attributes: attributes,
      eventValue: eventValue,
      variationIds: variationIds,
      validExperimentKeysForEvent: validExperimentKeysForEvent,
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
    this.errorHandler.handleError(ex);
  }
};

/**
 * Gets variation where visitor will be bucketed.
 * @param  {string} experimentKey
 * @param  {string} userId
 * @param  {Object} attributes
 * @return {string} the active variation
 */
Optimizely.prototype.getVariation = function(experimentKey, userId, attributes) {
  try {
    if (!this.__validateInputs(userId, attributes) || !this.__validatePreconditions(experimentKey, userId, attributes)) {
      return null;
    }
    var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
    var variationId = bucketer.bucket(bucketerParams);
    return projectConfig.getVariationKeyFromId(this.configObj, experimentKey, variationId);
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, ex.message);
    this.errorHandler.handleError(ex);
    return null;
  }
};

/**
 * Given event key, user ID, and attributes, returns experiment entities that are valid in tracking the event
 * @param  {string} eventKey   Event key being tracked
 * @param  {string} userId     ID of user
 * @param  {Object} attributes Optional parameter for user's attributes
 * @return {Object<Array>}     Object consisting of valid experiment keys and valid experiment IDs for event
 */
Optimizely.prototype.__getValidExperimentEntitiesForEvent = function(eventKey, userId, attributes) {
  var validExperimentIdsForEvent = [];
  var validExperimentKeysForEvent = [];
  if (this.configObj.eventKeyMap[eventKey]) {
    var experimentKey;
    _.forEach(this.configObj.eventKeyMap[eventKey].experimentIds, function(experimentId) {
      experimentKey = this.configObj.experimentIdMap[experimentId].key;

      // If user is not in audience for the experiment or experiment is not running, do not push experiment ID into validExperimentIdsForEvent
      if (!this.__validatePreconditions(experimentKey, userId, attributes)) {
        var failedTrackLogMessage = sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT, MODULE_NAME, userId, experimentKey);
        this.logger.log(LOG_LEVEL.INFO, failedTrackLogMessage);
      } else {
        validExperimentIdsForEvent.push(experimentId);
        validExperimentKeysForEvent.push(experimentKey);
      }
    }.bind(this));
  }

  var validExperimentEntities = {
    validExperimentIdsForEvent: validExperimentIdsForEvent,
    validExperimentKeysForEvent: validExperimentKeysForEvent,
  };

  return validExperimentEntities;
};

/**
 * Given a user ID and an array of valid experiments, returns variation ID
 * @param {Array} validExperimentIds Array of valid experiment IDs for the event being tracked
 * @param {string} userId                   ID of user
 * @return {Array<string>}
 */
Optimizely.prototype.__getBucketedVariationIdsForUser = function(validExperimentIds, userId) {
  try {
    var experimentKeys = _.filter(Object.keys(this.configObj.experimentKeyMap), function(experimentKey) {
      var experimentId = projectConfig.getExperimentId(this.configObj, experimentKey);
      return experimentId && (validExperimentIds.indexOf(experimentId) !== -1);
    }.bind(this));

    var variationIds = _.map(experimentKeys, function(experimentKey) {
      var bucketerParams = this.__buildBucketerParams(experimentKey, userId);
      return bucketer.bucket(bucketerParams);
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
 * @return {boolean} True if inputs are valid
 *
 */
Optimizely.prototype.__validateInputs = function(userId, userAttributes) {
  try {
    userIdValidator.validate(userId);
    if (userAttributes) {
      attributesValidator.validate(userAttributes);
    }
    return true;
  } catch (ex) {
    this.logger.log(LOG_LEVEL.ERROR, ex.message);
    this.errorHandler.handleError(ex);
    return false;
  }
};

/**
 * Checks whether the experiment is running and user is included in experiment audience
 * @param  {string}  experimentKey Key of experiment being validated
 * @param  {string}  userId        ID of user
 * @param  {Object}  attributes    Optional parameter for user's attributes
 * @return {boolean} True if experiment is running and user meets audience conditions
 */
Optimizely.prototype.__validatePreconditions = function(experimentKey, userId, attributes) {
  if (!projectConfig.isExperimentRunning(this.configObj, experimentKey)) {
    var experimentNotRunningLogMessage = sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, MODULE_NAME, experimentKey);
    this.logger.log(LOG_LEVEL.INFO, experimentNotRunningLogMessage);
    return false;
  }

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
Optimizely.prototype.__buildBucketerParams = function(experimentKey, userId) {
  var bucketerParams = {};
  bucketerParams.experimentKey = experimentKey;
  bucketerParams.experimentId = projectConfig.getExperimentId(this.configObj, experimentKey);
  bucketerParams.userId = userId;
  bucketerParams.forcedVariations = this.configObj.experimentKeyMap[experimentKey].forcedVariations;
  bucketerParams.trafficAllocationConfig = projectConfig.getTrafficAllocation(this.configObj, experimentKey);
  bucketerParams.experimentKeyMap = this.configObj.experimentKeyMap;
  bucketerParams.groupIdMap = this.configObj.groupIdMap;
  bucketerParams.experimentVariationKeyMap = this.configObj.experimentVariationKeyMap;
  bucketerParams.variationIdMap = this.configObj.variationIdMap;
  bucketerParams.logger = this.logger;
  return bucketerParams;
};

module.exports = Optimizely;
