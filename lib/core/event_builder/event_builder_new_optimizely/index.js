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
var _ = require('lodash/core');
var projectConfig = require('../../project_config');

var REVENUE_EVENT_METRIC_NAME = 'revenue';

module.exports = {

  NEW_OPTIMIZELY_IMPRESSION_ENDPOINT: 'https://logx.optimizely.com/log/decision',

  NEW_OPTIMIZELY_CONVERSION_ENDPOINT: 'https://logx.optimizely.com/log/event',

  POST_METHOD: 'POST',

  CUSTOM_ATTRIBUTE_FEATURE_TYPE: 'custom',

  /**
   * Creates object of params specific to impression events
   * @param  {Object} configObj     Object representing project configuration
   * @param  {string} experimentKey Experiment for which impression needs to be recorded
   * @param  {string} variationId   ID for variation which would be presented to user
   * @return {Object}               Impression event specific params for New Optimizely endpoint
   */
  getImpressionEventParams: function(configObj, experimentKey, variationId) {
    var impressionEventParams = {
      layerId: projectConfig.getLayerId(configObj, experimentKey),
      decision: {
        isLayerHoldback: false,
        experimentId: projectConfig.getExperimentId(configObj, experimentKey),
        variationId: variationId,
      },
    };
    return impressionEventParams;
  },

  /**
   * Creates object of params specific to conversion events
   * @param  {Object} configObj                   Object representing project configuration
   * @param  {string} eventKey                    Event key representing the event which needs to be recorded
   * @param  {number} eventValue                  Value associated with the event. Can be used to represent revenue in cents
   * @param  {Array}  variationIds                Experiment variation ID(s) which are being tracked
   * @param  {Array}  validExperimentKeysForEvent Array of valid experiment keys that are associated with the event key
   * @return {Object}                             Conversion event specific params for New Optimizely endpoint
   */
  getConversionEventParams: function(configObj, eventKey, eventValue, variationIds, validExperimentKeysForEvent) {
    var conversionEventParams = {
      eventEntityId: projectConfig.getEventId(configObj, eventKey),
      eventName: eventKey,
      eventFeatures: [],
      layerStates: [],
    };

    _.forEach(validExperimentKeysForEvent, function(experimentKey) {
      var experimentId = projectConfig.getExperimentId(configObj, experimentKey);
      var variationId = projectConfig.getEventVariationIdFromExperimentKey(configObj, experimentKey, variationIds);

      if (variationId) {
        var layerState = {
          layerId: projectConfig.getLayerId(configObj, experimentKey),
          revision: configObj.revision,
          decision: {
            isLayerHoldback: false,
            experimentId: experimentId,
            variationId: variationId,
          },
          actionTriggered: true,
        };

        conversionEventParams.layerStates.push(layerState);
      }
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
  },
};
