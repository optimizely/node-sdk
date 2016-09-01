var _ = require('lodash/core');
var environmentUtils = require('../../utils/environment');
var packageJSON = require('../../../package.json');
var sprintf = require('sprintf');

var projectConfig = require('../project_config');

/*****************************
 * Classic Optimizely endpoint
 *****************************/

var urlParams = {
  accountId: 'd',
  projectId: 'a',
  experimentPrefix: 'x',
  goalId: 'g',
  goalName: 'n',
  segmentPrefix: 's',
  endUserId: 'u',
  eventValue: 'v',
  source: 'src',
  time: 'time'
};

/**
 * Get attribute(s) information to the event
 * @param {Object} configObj  Object representing project configuration
 * @param {Object} attributes Object representing user attributes and values which need to be recorded
 */
function getAttributeParams(configObj, attributes) {
  var attributeParams = {};
  _.forEach(attributes, function(attributeValue, attributeKey) {
    if (attributeValue || attributeValue === false || attributeValue === 0) {
      var segmentId = configObj.attributeKeyMap[attributeKey].segmentId;
      var segmentParam = sprintf('%s%s', urlParams.segmentPrefix, segmentId);
      attributeParams[segmentParam] = attributeValue;
    }
  });
  return attributeParams;
}

/**
 * Get params which are used same in both conversion and impression events
 * @param  {Object} configObj  Object representing project configuration
 * @param  {string} userId     ID for user
 * @param  {Object} attributes Object representing user attributes and values which need to be recorded
 * @return {Object}            Common params with properties that are used in both conversion and impression events
 */
function getCommonParams(configObj, userId, attributes) {
  var params = {};
  params[urlParams.projectId] = configObj.projectId;
  params[urlParams.accountId] = configObj.accountId;
  params[urlParams.endUserId] = userId;

  if (attributes) {
    var attributeParams = getAttributeParams(configObj, attributes);
    _.assignIn(params, attributeParams);
  }

  // determine which SDK to attribute to based on the environment the code is
  // executing in
  var sdkName = environmentUtils.isNode() ? 'node-sdk' : 'javascript-sdk';

  params[urlParams.source] = sprintf('%s-%s', sdkName, packageJSON.version);
  params[urlParams.time] = Math.round(new Date().getTime() / 1000.0);
  return params;
}

/**
 * Get impression goal information to the event
 * @param  {Object} configObj     Object representing project configuration
 * @param  {string} experimentKey Experiment which is being activated
 * @return {Object}               Impression goal params with impression goal information
 */
function getImpressionGoalParams(configObj, experimentKey) {
  var impressionGoalParams = {};
  var experimentId = projectConfig.getExperimentId(configObj, experimentKey);
  // For tracking impressions, goal ID is set equal to experiment ID of experiment being activated
  impressionGoalParams[urlParams.goalId] = experimentId;
  impressionGoalParams[urlParams.goalName] = 'visitor-event';
  return impressionGoalParams;
}

/**
 * Get conversion goal information to the event
 * @param  {Object} configObj  Object representing project configuration
 * @param  {string} eventKey   Goal key representing the event which needs to be recorded
 * @param  {number} eventValue Value associated with the event. Can be used to represent revenue in cents.
 * @return {Object}            Conversion goal params with conversion goal information
 */
function getConversionGoalParams(configObj, eventKey, eventValue) {
  var conversionGoalParams = {};
  var goalId = configObj.eventKeyMap[eventKey].id;
  var eventIds = goalId;
  if (eventValue) {
    eventIds = sprintf('%s,%s', goalId, projectConfig.getRevenueGoalId(configObj));
    conversionGoalParams[urlParams.eventValue] = eventValue;
  }
  conversionGoalParams[urlParams.goalId] = eventIds;
  conversionGoalParams[urlParams.goalName] = eventKey;
  return conversionGoalParams;
}

/**
 * Get experiment to variation mapping to the impression event
 * @param  {Object} configObj     Object representing project configuration
 * @param  {string} experimentKey Experiment which is being activated
 * @param  {string} variationId   Experiment which is being activated
 * @return {Object}               Experiment params with experiment to variation mapping for impression events
 */
function getExperimentParams(configObj, experimentKey, variationId) {
  var experimentParams = {};
  var experimentId = projectConfig.getExperimentId(configObj, experimentKey);
  var experimentParam = sprintf('%s%s', urlParams.experimentPrefix, experimentId);
  experimentParams[experimentParam] = variationId;
  return experimentParams;
}

/**
 * Maps experiment and corresponding variation as parameters to be used in the event tracking call
 * @param  {Object} configObj                 Object representing project configuration
 * @param  {Array} variationIds              Experiment(s) which are being tracked
 * @param  {Array}  validExperimentIdsForGoal Array of valid experiment IDs that are associated with the event being tracked
 * @return {Object}                           Experiment variation params with experiment to variation mapping for conversion events
 */
function getExperimentVariationParams(configObj, variationIds, validExperimentIdsForGoal) {
  var experimentVariationParams = {};

  // Get experiment IDs
  var experimentKeys = _.filter(Object.keys(configObj.experimentKeyMap), function(experimentKey) {
    var experimentId = configObj.experimentKeyMap[experimentKey].id;

    if (experimentId && (validExperimentIdsForGoal.indexOf(experimentId) !== -1)) {
      return experimentKey;
    }
  });

  _.forEach(experimentKeys, function(experimentKey) {
    var experimentId = projectConfig.getExperimentId(configObj, experimentKey);
    var experimentParam = sprintf('%s%s', urlParams.experimentPrefix, experimentId);
    var variationId = projectConfig.getEventVariationIdFromExperimentKey(configObj, experimentKey, variationIds);
    experimentVariationParams[experimentParam] = variationId;
  });

  return experimentVariationParams;
}

/*****************************
 * New Optimizely endpoint
 *****************************/

var NEW_OPTIMIZELY_VERSION = '2';
var NEW_OPTIMIZELY_IMPRESSION_ENDPOINT = 'https://p13nlog.dz.optimizely.com/log/decision';
var NEW_OPTIMIZELY_CONVERSION_ENDPOINT = 'https://p13nlog.dz.optimizely.com/log/event';
var CLASSIC_OPTIMIZELY_ENDPOINT = 'https://%s.log.optimizely.com/event';
var POST_METHOD = 'POST';
var GET_METHOD = 'GET';
var CUSTOM_ATTRIBUTE_FEATURE_TYPE = 'custom';
var REVENUE_EVENT_METRIC_NAME = 'revenue';

/**
 * Get params which are used same in both conversion and impression events
 * @param configObj  Object representing project configuration
 * @param userId     ID for user
 * @param attributes Object representing user attributes and values which need to be recorded
 * @return {Object}  Event params used for impression or conversion event
 */
function getCommonEventParams(configObj, userId, attributes) {
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
        shouldIndex: false,
      };
      commonParams.userFeatures.push(feature);
    }
  }
  return commonParams;
}

/**
 *
 * @param configObj     Object representing project configuration
 * @param experimentKey Experiment for which impression needs to be recorded
 * @param variationId   ID for variation which would be presented to user
 * @return {Object}     Impression event specific params
 */
function getImpressionEventParams(configObj, experimentKey, variationId) {
  var impressionEventParams = {
    layerId: projectConfig.getLayerId(configObj, experimentKey),
    decision: {
      isLayerHoldback: false,
      experimentId: projectConfig.getExperimentId(configObj, experimentKey),
      variationId: variationId,
    },
  };
  return impressionEventParams;
}

/**
 *
 * @param {Object} configObj         Object representing project configuration
 * @param {string} eventKey          Event key representing the event which needs to be recorded
 * @param {integer} eventValue       Value associated with the event. Can be used to represent revenue in cents
 * @param {Array} variationIds       Experiment variation ID(s) which are being tracked
 * @param validExperimentIdsForEvent Array of valid experiment IDs that are associated with the event key
 * @return {Object}                  Conversion event specific params
 */
function getConversionEventParams(configObj, eventKey, eventValue, variationIds, validExperimentIdsForEvent) {
  var conversionEventParams = {
    eventEntityId: projectConfig.getEventId(configObj, eventKey),
    eventName: eventKey,
    eventFeatures: [],
    layerStates: [],
  };

  // Get valid experiment keys for event
  var experimentKeys = _.filter(Object.keys(configObj.experimentKeyMap), function(experimentKey) {
    var experimentId = configObj.experimentKeyMap[experimentKey].id;

    return !!experimentId && (validExperimentIdsForEvent.indexOf(experimentId) !== -1);
  });

  _.forEach(experimentKeys, function(experimentKey) {
    var experimentId = projectConfig.getExperimentId(configObj, experimentKey);
    var variationId = projectConfig.getEventVariationIdFromExperimentKey(configObj, experimentKey, variationIds);

    var layerState = {
      layerId: projectConfig.getLayerId(configObj, experimentKey),
      decision: {
        isLayerHoldback: false,
        experimentId: experimentId,
        variationId: variationId,
      },
      actionTriggered: true,
    };

    conversionEventParams.layerStates.push(layerState);
  });

  conversionEventParams.eventMetrics = [];
  if (eventValue) {
    var revenueMetric = {
      name: REVENUE_EVENT_METRIC_NAME,
      value: eventValue,
    };
    conversionEventParams.eventMetrics.push(revenueMetric);
  }
  return conversionEventParams;
}

/**
 * Get HTTP verb for sending impression/conversion event
 * @param  {Object} configObj Object representing project configuration
 * @return {string} HTTP verb for the event API
 */
function getHTTPVerb(configObj) {
  return configObj.version === NEW_OPTIMIZELY_VERSION ? POST_METHOD : GET_METHOD;
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

    if (options.configObj.version === NEW_OPTIMIZELY_VERSION) {
      impressionEvent.url = NEW_OPTIMIZELY_IMPRESSION_ENDPOINT;

      var commonParams = getCommonEventParams(options.configObj, options.userId, options.attributes);
      var impressionEventParams = getImpressionEventParams(options.configObj, options.experimentKey, options.variationId);
      impressionEvent.params = _.assignIn(commonParams, impressionEventParams);
    } else {
      impressionEvent.url = sprintf(CLASSIC_OPTIMIZELY_ENDPOINT, options.configObj.projectId);

      var commonParams = getCommonParams(options.configObj, options.userId, options.attributes);
      var impressionGoalParams = getImpressionGoalParams(options.configObj, options.experimentKey);
      var experimentParams = getExperimentParams(options.configObj, options.experimentKey, options.variationId);
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

    if (options.configObj.version === NEW_OPTIMIZELY_VERSION) {
      conversionEvent.url = NEW_OPTIMIZELY_CONVERSION_ENDPOINT;

      var commonParams = getCommonEventParams(options.configObj, options.userId, options.attributes);
      var conversionEventParams = getConversionEventParams(options.configObj, options.eventKey, options.eventValue, options.variationIds, options.validExperimentIdsForGoal);
      conversionEvent.params = _.assignIn(commonParams, conversionEventParams);
    } else {
      conversionEvent.url = sprintf(CLASSIC_OPTIMIZELY_ENDPOINT, options.configObj.projectId);

      var commonParams = getCommonParams(options.configObj, options.userId, options.attributes);
      var conversionGoalParams = getConversionGoalParams(options.configObj, options.eventKey, options.eventValue);
      var experimentVariationParams = getExperimentVariationParams(options.configObj, options.variationIds, options.validExperimentIdsForGoal);
      conversionEvent.params = _.assignIn(commonParams, conversionGoalParams, experimentVariationParams);
    }

    return conversionEvent;
  },
};
