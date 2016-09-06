var _ = require('lodash/core');
var projectConfig = require('../../project_config');

var REVENUE_EVENT_METRIC_NAME = 'revenue';

module.exports = {
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
   * @param  {Object} configObj                  Object representing project configuration
   * @param  {string} eventKey                   Event key representing the event which needs to be recorded
   * @param  {number} eventValue                 Value associated with the event. Can be used to represent revenue in cents
   * @param  {Array}  variationIds               Experiment variation ID(s) which are being tracked
   * @param  {Array}  validExperimentIdsForEvent Array of valid experiment IDs that are associated with the event key
   * @return {Object}                            Conversion event specific params for New Optimizely endpoint
   */
  getConversionEventParams: function(configObj, eventKey, eventValue, variationIds, validExperimentIdsForEvent) {
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
  },
};
