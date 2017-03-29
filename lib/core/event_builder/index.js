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
var lodashForOwn = require('lodash/forOwn');
var projectConfig = require('../project_config');

var CONVERSION_ENDPOINT = 'https://logx.optimizely.com/log/event';
var IMPRESSION_ENDPOINT = 'https://logx.optimizely.com/log/decision';
var CUSTOM_ATTRIBUTE_FEATURE_TYPE = 'custom';
var HTTP_VERB = 'POST';
var REVENUE_EVENT_METRIC_NAME = 'revenue';


/**
 * Get params which are used same in both conversion and impression events
 * @param  {Object} options.attributes    Object representing user attributes and values which need to be recorded
 * @param  {string} options.clientEngine  The client we are using: node or javascript
 * @param  {string} options.clientVersion The version of the client
 * @param  {Object} options.configObj     Object representing project configuration, including datafile information and mappings for quick lookup
 * @param  {string} options.userId        ID for user
 * @return {Object}                       Common params with properties that are used in both conversion and impression events
 */
function getCommonEventParams(options) {
  var attributes = options.attributes;
  var configObj = options.configObj;
  var userId = options.userId;

  var commonParams = {
    accountId: configObj.accountId,
    projectId: configObj.projectId,
    revision: configObj.revision,
    visitorId: userId,
    timestamp: Math.round(new Date().getTime()),
    isGlobalHoldback: false,
    userFeatures: [],
    // Used for tracking SDK type and version
    clientEngine: options.clientEngine,
    clientVersion: options.clientVersion,
  };

  for (var attributeKey in attributes) {
    var attributeId = projectConfig.getAttributeId(options.configObj, attributeKey);
    if (attributeId) {
      var feature = {
        id: attributeId,
        name: attributeKey,
        type: CUSTOM_ATTRIBUTE_FEATURE_TYPE,
        value: attributes[attributeKey],
        shouldIndex: true,
      };
      commonParams.userFeatures.push(feature);
    }
  }
  return commonParams;
}

/**
 * Creates object of params specific to impression events
 * @param  {Object} configObj     Object representing project configuration
 * @param  {string} experimentKey Experiment for which impression needs to be recorded
 * @param  {string} variationId   ID for variation which would be presented to user
 * @return {Object}               Impression event params
 */
function getImpressionEventParams(configObj, experimentId, variationId) {
  var impressionEventParams = {
    layerId: projectConfig.getLayerId(configObj, experimentId),
    decision: {
      isLayerHoldback: false,
      experimentId: experimentId,
      variationId: variationId,
    },
  };
  return impressionEventParams;
}

/**
 * Creates object of params specific to conversion events
 * @param  {Object} configObj                 Object representing project configuration
 * @param  {string} eventKey                  Event key representing the event which needs to be recorded
 * @param  {Object} eventTags                 Values associated with the event.
 * @param  {Array}  experimentsToVariationMap Map of experiment ids to bucketed variation ids
 * @return {Object}                           Conversion event params
 */
function getConversionEventParams(configObj, eventKey, eventTags, experimentsToVariationMap) {
  var conversionEventParams = {
    eventEntityId: projectConfig.getEventId(configObj, eventKey),
    eventName: eventKey,
    eventFeatures: [],
    layerStates: [],
  };

  lodashForOwn(experimentsToVariationMap, function(variationId, experimentId) {
    var layerState = {
      layerId: projectConfig.getLayerId(configObj, experimentId),
      revision: configObj.revision,
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

  if (eventTags) {
    _.forEach(eventTags, function(eventTagValue, eventTagKey) {
      if (eventTagKey === REVENUE_EVENT_METRIC_NAME) {
        var revenueMetric = {
          name: REVENUE_EVENT_METRIC_NAME,
          value: eventTagValue,
        };
        conversionEventParams.eventMetrics.push(revenueMetric);
      }
      var eventFeature = {
        name: eventTagKey,
        type: CUSTOM_ATTRIBUTE_FEATURE_TYPE,
        value: eventTagValue,
        shouldIndex: false,
      };
      conversionEventParams.eventFeatures.push(eventFeature);
    });
  }

  return conversionEventParams;
}

module.exports = {

  /**
   * Create impression event params to be sent to the logging endpoint
   * @param  {Object} options               Object containing values needed to build impression event
   * @param  {Object} options.attributes    Object representing user attributes and values which need to be recorded
   * @param  {string} options.clientEngine  The client we are using: node or javascript
   * @param  {string} options.clientVersion The version of the client
   * @param  {Object} options.configObj     Object representing project configuration, including datafile information and mappings for quick lookup
   * @param  {string} options.experimentId  Experiment for which impression needs to be recorded
   * @param  {string} options.userId        ID for user
   * @param  {string} options.variationId   ID for variation which would be presented to user
   * @return {Object}                       Params to be used in impression event logging endpoint call
   */
  getImpressionEvent: function(options) {
    var impressionEvent = {
      httpVerb: HTTP_VERB
    };

    var commonParams = getCommonEventParams(options);
    impressionEvent.url = IMPRESSION_ENDPOINT;

    var impressionEventParams = getImpressionEventParams(options.configObj, options.experimentId, options.variationId);
    impressionEvent.params = _.assignIn(commonParams, impressionEventParams);

    return impressionEvent;
  },

  /**
   * Create conversion event params to be sent to the logging endpoint
   * @param  {Object} options                           Object containing values needed to build conversion event
   * @param  {Object} options.attributes                Object representing user attributes and values which need to be recorded
   * @param  {string} options.clientEngine              The client we are using: node or javascript
   * @param  {string} options.clientVersion             The version of the client
   * @param  {Object} options.configObj                 Object representing project configuration, including datafile information and mappings for quick lookup
   * @param  {string} options.eventKey                  Event key representing the event which needs to be recorded
   * @param  {Object} options.eventTags                 Object with event-specific tags
   * @param  {string} options.userId                    ID for user
   * @param  {Object} options.experimentsToVariationMap Map of experiment ids to bucketed variation ids
   * @return {Object}                                   Params to be used in conversion event logging endpoint call
   */
  getConversionEvent: function(options) {
    var conversionEvent = {
      httpVerb: HTTP_VERB,
    };

    var commonParams = getCommonEventParams(options);
    conversionEvent.url = CONVERSION_ENDPOINT;

    var conversionEventParams = getConversionEventParams(options.configObj,
                                                         options.eventKey,
                                                         options.eventTags,
                                                         options.experimentsToVariationMap);
    conversionEvent.params = _.assignIn(commonParams, conversionEventParams);
    return conversionEvent;
  },
};
