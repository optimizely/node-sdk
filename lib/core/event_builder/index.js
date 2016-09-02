var _ = require('lodash/core');
var environmentUtils = require('../../utils/environment');
var packageJSON = require('../../../package.json');
var sprintf = require('sprintf');

var classicOptimizelyEventBuilder = require('./event_builder_classic_optimizely');
var newOptimizelyEventBuilder = require('./event_builder_new_optimizely');
var projectConfig = require('../project_config');

var POST_METHOD = 'POST';
var GET_METHOD = 'GET';
var NEW_OPTIMIZELY_VERSION = '2';
var NEW_OPTIMIZELY_IMPRESSION_ENDPOINT = 'https://p13nlog.dz.optimizely.com/log/decision';
var NEW_OPTIMIZELY_CONVERSION_ENDPOINT = 'https://p13nlog.dz.optimizely.com/log/event';
var CLASSIC_OPTIMIZELY_ENDPOINT = 'https://%s.log.optimizely.com/event';
var CUSTOM_ATTRIBUTE_FEATURE_TYPE = 'custom';

/**
 * Get HTTP verb for sending impression/conversion event
 * @param  {Object} configObj Object representing project configuration
 * @return {string} HTTP verb for the event API
 */
function getHTTPVerb(configObj) {
  return configObj.version === NEW_OPTIMIZELY_VERSION ? POST_METHOD : GET_METHOD;
}

/**
 * Get params which are used same in both conversion and impression events
 * @param  {Object} configObj  Object representing project configuration
 * @param  {string} userId     ID for user
 * @param  {Object} attributes Object representing user attributes and values which need to be recorded
 * @return {Object}            Common params with properties that are used in both conversion and impression events
 */
function getCommonEventParams(configObj, userId, attributes) {
  if (configObj.version === NEW_OPTIMIZELY_VERSION) {
    var commonParams = {
      accountId: configObj.accountId,
      projectId: configObj.projectId,
      visitorId: userId,
      timestamp: Math.round(new Date().getTime()),
      isGlobalHoldback: false,
      userFeatures: [],

      // Used for tracking SDK type and version
      clientEngine: environmentUtils.isNode() ? 'node-sdk' : 'javascript-sdk',
      clientVersion: packageJSON.version,
    };

    for (var attributeKey in attributes) {
      if (attributes.hasOwnProperty(attributeKey)) {
        var feature = {
          id: projectConfig.getAttributeId(configObj, attributeKey),
          name: attributeKey,
          type: CUSTOM_ATTRIBUTE_FEATURE_TYPE,
          value: attributes[attributeKey],
          shouldIndex: true,
        };
        commonParams.userFeatures.push(feature);
      }
    }
    return commonParams;
  } else {
    var params = {};
    params[classicOptimizelyEventBuilder.urlParams.projectId] = configObj.projectId;
    params[classicOptimizelyEventBuilder.urlParams.accountId] = configObj.accountId;
    params[classicOptimizelyEventBuilder.urlParams.endUserId] = userId;

    if (attributes) {
      var attributeParams = classicOptimizelyEventBuilder.getAttributeParams(configObj, attributes);
      _.assignIn(params, attributeParams);
    }

    // determine which SDK to attribute to based on the environment the code is
    // executing in
    var sdkName = environmentUtils.isNode() ? 'node-sdk' : 'javascript-sdk';

    params[classicOptimizelyEventBuilder.urlParams.source] = sprintf('%s-%s', sdkName, packageJSON.version);
    params[classicOptimizelyEventBuilder.urlParams.time] = Math.round(new Date().getTime() / 1000.0);
    return params;
  }
}

module.exports = {

  /**
   * Create impression event params to be sent to the logging endpoint
   * @param  {Object} options               Object containing values needed to build impression event
   * @param  {Object} options.configObj     Object representing project configuration
   * @param  {string} options.experimentKey Experiment for which impression needs to be recorded
   * @param  {string} options.variationId   ID for variation which would be presented to user
   * @param  {string} options.userId        ID for user
   * @param  {Object} options.attributes    Object representing user attributes and values which need to be recorded
   * @return {Object}                       Params to be used in impression event logging endpoint call
   */
  getImpressionEvent: function(options) {
    var impressionEvent = {
      httpVerb: getHTTPVerb(options.configObj),
    };

    var commonParams = getCommonEventParams(options.configObj, options.userId, options.attributes);

    if (options.configObj.version === NEW_OPTIMIZELY_VERSION) {
      impressionEvent.url = NEW_OPTIMIZELY_IMPRESSION_ENDPOINT;

      var impressionEventParams = newOptimizelyEventBuilder.getImpressionEventParams(options.configObj, options.experimentKey, options.variationId);
      impressionEvent.params = _.assignIn(commonParams, impressionEventParams);
    } else {
      impressionEvent.url = sprintf(CLASSIC_OPTIMIZELY_ENDPOINT, options.configObj.projectId);

      var impressionGoalParams = classicOptimizelyEventBuilder.getImpressionGoalParams(options.configObj, options.experimentKey);
      var experimentParams = classicOptimizelyEventBuilder.getExperimentParams(options.configObj, options.experimentKey, options.variationId);
      impressionEvent.params = _.assignIn(commonParams, impressionGoalParams, experimentParams);
    }

    return impressionEvent;
  },

  /**
   * Create conversion event params to be sent to the logging endpoint
   * @param  {Object} options                           Object containing values needed to build conversion event
   * @param  {Object} options.configObj                 Object representing project configuration
   * @param  {string} options.eventKey                  Event key representing the event which needs to be recorded
   * @param  {string} options.userId                    ID for user
   * @param  {Object} options.attributes                Object representing user attributes and values which need to be recorded
   * @param  {string} options.eventValue                Value associated with the event. Can be used to represent revenue in cents
   * @param  {Array} options.variationIds               Experiment variation ID(s) which are being tracked
   * @param  {Array}  options.validExperimentIdsForGoal Array of valid experiment IDs that are associated with the event key
   * @return {Object}                                   Params to be used in conversion event logging endpoint call
   */
  getConversionEvent: function(options) {
    var conversionEvent = {
      httpVerb: getHTTPVerb(options.configObj),
    };

    var commonParams = getCommonEventParams(options.configObj, options.userId, options.attributes);

    if (options.configObj.version === NEW_OPTIMIZELY_VERSION) {
      conversionEvent.url = NEW_OPTIMIZELY_CONVERSION_ENDPOINT;

      var conversionEventParams = newOptimizelyEventBuilder.getConversionEventParams(options.configObj, options.eventKey, options.eventValue, options.variationIds, options.validExperimentIdsForGoal);
      conversionEvent.params = _.assignIn(commonParams, conversionEventParams);
    } else {
      conversionEvent.url = sprintf(CLASSIC_OPTIMIZELY_ENDPOINT, options.configObj.projectId);

      var conversionGoalParams = classicOptimizelyEventBuilder.getConversionGoalParams(options.configObj, options.eventKey, options.eventValue);
      var experimentVariationParams = classicOptimizelyEventBuilder.getExperimentVariationParams(options.configObj, options.variationIds, options.validExperimentIdsForGoal);
      conversionEvent.params = _.assignIn(commonParams, conversionGoalParams, experimentVariationParams);
    }

    return conversionEvent;
  },
};
