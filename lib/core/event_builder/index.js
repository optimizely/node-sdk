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
var enums = require('../../utils/enums');
var sprintf = require('sprintf');

var classicOptimizelyEventBuilder = require('./event_builder_classic_optimizely');
var newOptimizelyEventBuilder = require('./event_builder_new_optimizely');
var projectConfig = require('../project_config');

/**
 * Get HTTP verb for sending impression/conversion event
 * @param  {Object} configObj Object representing project configuration
 * @return {string} HTTP verb for the event API
 */
function getHTTPVerb(configObj) {
  return configObj.version === enums.NEW_OPTIMIZELY_VERSION ?
    newOptimizelyEventBuilder.POST_METHOD : classicOptimizelyEventBuilder.GET_METHOD;
}

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

  if (configObj.version === enums.NEW_OPTIMIZELY_VERSION) {
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
          type: newOptimizelyEventBuilder.CUSTOM_ATTRIBUTE_FEATURE_TYPE,
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

    params[classicOptimizelyEventBuilder.urlParams.source] = sprintf('%s-%s', options.clientEngine, options.clientVersion);
    params[classicOptimizelyEventBuilder.urlParams.time] = Math.round(new Date().getTime() / 1000.0);
    return params;
  }
}

module.exports = {

  /**
   * Create impression event params to be sent to the logging endpoint
   * @param  {Object} options               Object containing values needed to build impression event
   * @param  {Object} options.attributes    Object representing user attributes and values which need to be recorded
   * @param  {string} options.clientEngine  The client we are using: node or javascript
   * @param  {string} options.clientVersion The version of the client
   * @param  {Object} options.configObj     Object representing project configuration, including datafile information and mappings for quick lookup
   * @param  {string} options.experimentKey Experiment for which impression needs to be recorded
   * @param  {string} options.userId        ID for user
   * @param  {string} options.variationId   ID for variation which would be presented to user
   * @return {Object}                       Params to be used in impression event logging endpoint call
   */
  getImpressionEvent: function(options) {
    var impressionEvent = {
      httpVerb: getHTTPVerb(options.configObj),
    };

    var commonParams = getCommonEventParams(options);

    if (options.configObj.version === enums.NEW_OPTIMIZELY_VERSION) {
      impressionEvent.url = newOptimizelyEventBuilder.NEW_OPTIMIZELY_IMPRESSION_ENDPOINT;

      var impressionEventParams = newOptimizelyEventBuilder.getImpressionEventParams(options.configObj, options.experimentKey, options.variationId);
      impressionEvent.params = _.assignIn(commonParams, impressionEventParams);
    } else {
      impressionEvent.url = sprintf(classicOptimizelyEventBuilder.CLASSIC_OPTIMIZELY_ENDPOINT, options.configObj.projectId);

      var impressionEventParams = classicOptimizelyEventBuilder.getImpressionGoalParams(options.configObj, options.experimentKey);
      var experimentParams = classicOptimizelyEventBuilder.getExperimentParams(options.configObj, options.experimentKey, options.variationId);
      impressionEvent.params = _.assignIn(commonParams, impressionEventParams, experimentParams);
    }

    return impressionEvent;
  },

  /**
   * Create conversion event params to be sent to the logging endpoint
   * @param  {Object} options                             Object containing values needed to build conversion event
   * @param  {Object} options.attributes                  Object representing user attributes and values which need to be recorded
   * @param  {string} options.clientEngine                The client we are using: node or javascript
   * @param  {string} options.clientVersion               The version of the client
   * @param  {Object} options.configObj                   Object representing project configuration, including datafile information and mappings for quick lookup
   * @param  {string} options.eventKey                    Event key representing the event which needs to be recorded
   * @param  {string} options.eventValue                  Value associated with the event. Can be used to represent revenue in cents
   * @param  {Object} options.eventTags                   Value associated with the event. Can be used to represent revenue in cents
   * @param  {string} options.userId                      ID for user
   * @param  {Array}  options.variationIds                Experiment variation ID(s) which are being tracked
   * @param  {Array}  options.validExperimentKeysForEvent Array of valid experiment keys that are associated with the event key
   * @param  {string} options.sessionId                   ID for user's current session
   * @return {Object}                                     Params to be used in conversion event logging endpoint call
   */
  getConversionEvent: function(options) {
    var conversionEvent = {
      httpVerb: getHTTPVerb(options.configObj),
    };

    var commonParams = getCommonEventParams(options);

    if (options.configObj.version === enums.NEW_OPTIMIZELY_VERSION) {
      commonParams.sessionId = options.sessionId || null;

      conversionEvent.url = newOptimizelyEventBuilder.NEW_OPTIMIZELY_CONVERSION_ENDPOINT;

      var conversionEventParams = newOptimizelyEventBuilder.getConversionEventParams(options.configObj,
                                                                                     options.eventKey,
                                                                                     options.eventValue,
                                                                                     options.variationIds,
                                                                                     options.validExperimentKeysForEvent);
      conversionEvent.params = _.assignIn(commonParams, conversionEventParams);
    } else {
      conversionEvent.url = sprintf(classicOptimizelyEventBuilder.CLASSIC_OPTIMIZELY_ENDPOINT,
                                    options.configObj.projectId);

      var conversionEventParams = classicOptimizelyEventBuilder.getConversionGoalParams(options.configObj,
                                                                                        options.eventKey,
                                                                                        options.eventValue);
      var experimentVariationParams = classicOptimizelyEventBuilder.getExperimentVariationParams(options.configObj,
                                                                                                 options.variationIds,
                                                                                                 options.validExperimentKeysForEvent);
      conversionEvent.params = _.assignIn(commonParams, conversionEventParams, experimentVariationParams);
    }

    return conversionEvent;
  },
};
