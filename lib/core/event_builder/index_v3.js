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
var fns = require('../../utils/fns');
var projectConfig = require('../project_config');
var uuid = require('uuid');

var ENDPOINT = 'https://logx.optimizely.com/v1/events';
var CUSTOM_ATTRIBUTE_FEATURE_TYPE = 'custom';
var HTTP_VERB = 'POST';
var REVENUE_EVENT_METRIC_NAME = 'revenue';
var ACTIVATE_EVENT_KEY = 'campaign_activated';


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

  var visitor = {
    snapshots: [],
    visitor_id: options.userId,
    attributes: []
  };

  var commonParams = {
    account_id: configObj.accountId,
    project_id: configObj.projectId,
    visitors: [visitor],
    revision: configObj.revision,
    client_name: options.clientEngine,
    client_version: options.clientVersion,
  };

  fns.forOwn(attributes, function(attributeKey, attributeValue){
    var attributeId = projectConfig.getAttributeId(options.configObj, attributeValue);
    if (attributeId) {
      var feature = {
        entity_id: attributeId,
        key: attributeValue,
        type: CUSTOM_ATTRIBUTE_FEATURE_TYPE,
        value: attributes[attributeValue],
      };
      commonParams.visitors[0].attributes.push(feature);
    }
  });
  return commonParams;
}

/**
 * Creates object of params specific to impression events
 * @param  {Object} configObj    Object representing project configuration
 * @param  {string} experimentId ID of experiment for which impression needs to be recorded
 * @param  {string} variationId  ID for variation which would be presented to user
 * @return {Object}              Impression event params
 */
function getImpressionEventParams(configObj, experimentId, variationId) {
  var impressionEventParams = {
      decisions: [{
        campaign_id: projectConfig.getLayerId(configObj, experimentId),
        experiment_id: experimentId,
        variation_id: variationId,
      }],
      events: [{
        entity_id: projectConfig.getLayerId(configObj, experimentId),
        timestamp: Math.round(new Date().getTime()),
        key: ACTIVATE_EVENT_KEY,
        uuid: uuid.v4()
      }]

    };
  return impressionEventParams;
}

/**
 * Creates object of params specific to conversion events
 * @param  {Object} configObj                 Object representing project configuration
 * @param  {string} eventKey                  Event key representing the event which needs to be recorded
 * @param  {Object} eventTags                 Values associated with the event.
 * @param  {Array}  experimentsToVariationMap Map of experiment IDs to bucketed variation IDs
 * @return {Object}                           Conversion event params
 */
function getConversionEventParams(configObj, eventKey, eventTags, experimentsToVariationMap) {

  var conversionEventParams = [];

  fns.forOwn(experimentsToVariationMap, function(variationId, experimentId) {

    var decision = {
      decisions: [{
        campaign_id: projectConfig.getLayerId(configObj, experimentId),
        experiment_id: experimentId,
        variation_id: variationId,
      }],
      events: [],
    };

    var eventDict = {
      entity_id: projectConfig.getEventId(configObj, eventKey),
      timestamp: Math.round(new Date().getTime()),
      uuid: uuid.v4(),
      key: eventKey,
    };

    if (eventTags) {
      fns.forEach(eventTags, function(eventTagValue, eventTagKey) {
        if (eventTagKey === REVENUE_EVENT_METRIC_NAME) {
          eventDict['revenue'] = eventTagValue;
        }
      });

      eventDict['tags'] = eventTags;
    }
    decision.events = [eventDict];

    conversionEventParams.push(decision);
  });

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
    impressionEvent.url = ENDPOINT;

    var impressionEventParams = getImpressionEventParams(options.configObj, options.experimentId, options.variationId);
    // combine Event params into visitor obj
    commonParams.visitors[0].snapshots.push(impressionEventParams);

    impressionEvent.params = commonParams;

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
   * @param  {Object} options.experimentsToVariationMap Map of experiment IDs to bucketed variation IDs
   * @return {Object}                                   Params to be used in conversion event logging endpoint call
   */
  getConversionEvent: function(options) {
    var conversionEvent = {
      httpVerb: HTTP_VERB,
    };

    var commonParams = getCommonEventParams(options);
    conversionEvent.url = ENDPOINT;

    var conversionEventParams = getConversionEventParams(options.configObj,
                                                         options.eventKey,
                                                         options.eventTags,
                                                         options.experimentsToVariationMap);

    commonParams.visitors[0].snapshots = conversionEventParams;
    conversionEvent.params = commonParams;

    return conversionEvent;
  },
};
