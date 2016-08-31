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
 * @param  {string} variationIds              Experiment(s) which are being tracked
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
var NEW_OPTIMIZELY_ENDPOINT = 'https://p13nlog.dz.optimizely.com/log/decision';
var NEW_OPTIMIZELY_HTTP_VERB = 'POST';
var CLASSIC_OPTIMIZELY_HTTP_VERB = 'GET';
var CUSTOM_ATTRIBUTE_FEATURE_TYPE = 'custom';
var REVENUE_EVENT_METRIC_NAME = 'revenue';

function getCommonEventParams(configObj, userId, attributes) {
  var commonParams = {
    accountId: configObj.accountId,
    projectId: configObj.projectId,
    visitorId: userId,
    timestamp: Math.round(new Date().getTime()),
    isGlobalHoldback: false,
    userFeatures: [],
  };

  for (var attributeKey in attributes) {
    if (attributes.hasOwnProperty(attributeKey)) {
      var feature = {
        id: projectConfig.getAttributeId(configObj, attributeKey),
        name: attributeKey,
        type: CUSTOM_ATTRIBUTE_FEATURE_TYPE,
        value: attributes[attributeKey],
      };
      commonParams.userFeatures.push(feature);
    }
  }
  return commonParams;
}

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
 * Get URL for sending impression/conversion event
 * @param  {Object} configObj Object representing project configuration
 * @return {string} URL for the event API
 */
function getUrl(configObj) {
  if (configObj.version === NEW_OPTIMIZELY_VERSION) {
    return NEW_OPTIMIZELY_ENDPOINT;
  } else {
    return sprintf('https://%s.log.optimizely.com/event', configObj.projectId);
  }
}

/**
 * Get HTTP verb for sending impression/conversion event
 * @param  {Object} configObj Object representing project configuration
 * @return {string} HTTP verb for the event API
 */

function getHTTPVerb(configObj) {
  return configObj.version === NEW_OPTIMIZELY_VERSION ? NEW_OPTIMIZELY_HTTP_VERB : CLASSIC_OPTIMIZELY_HTTP_VERB;
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
      url: getUrl(options.configObj),
      httpVerb: getHTTPVerb(options.configObj),
    };

    if (options.configObj.version === NEW_OPTIMIZELY_VERSION) {
      var commonParams = getCommonEventParams(options.configObj, options.userId, options.attributes);
      var impressionEventParams = getImpressionEventParams(options.configObj, options.experimentKey, options.variationId);
      impressionEvent.params = _.assignIn(commonParams, impressionEventParams);
    } else {
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
   * @param  {string} options.eventKey                  Goal key representing the event which needs to be recorded
   * @param  {string} options.userId                    ID for user
   * @param  {Object} options.attributes                Object representing user attributes and values which need to be recorded
   * @param  {string} options.eventValue                Value associated with the event. Can be used to represent revenue in cents.
   * @param  {string} options.variationIds              Experiment(s) which are being tracked
   * @param  {Array}  options.validExperimentIdsForGoal Array of valid experiment IDs that are associated with the event key
   * @return {Object}                                   Params to be used in conversion event logging endpoint call
   */
  getConversionEvent: function(options) {
    var conversionEvent = {
      url: getUrl(options.configObj),
      httpVerb: getHTTPVerb(options.configObj),
    };

    if (options.configObj.version === NEW_OPTIMIZELY_VERSION) {
      var commonParams = getCommonEventParams(options.configObj, options.userId, options.attributes);
      var conversionEventParams = getConversionEventParams(options.configObj, options.eventKey, options.eventValue, options.variationIds, options.validExperimentIdsForGoal);
      conversionEvent.params = _.assignIn(commonParams, conversionEventParams);
    } else {
      var commonParams = getCommonParams(options.configObj, options.userId, options.attributes);
      var conversionGoalParams = getConversionGoalParams(options.configObj, options.eventKey, options.eventValue);
      var experimentVariationParams = getExperimentVariationParams(options.configObj, options.variationIds, options.validExperimentIdsForGoal);
      conversionEvent.params = _.assignIn(commonParams, conversionGoalParams, experimentVariationParams);
    }

    return conversionEvent;
  },
};
