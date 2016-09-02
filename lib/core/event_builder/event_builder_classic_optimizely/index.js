var _ = require('lodash/core');
var projectConfig = require('../../project_config');
var sprintf = require('sprintf');

module.exports = {
  urlParams: {
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
  },

  /**
   * Get attribute(s) information to the event
   * @param {Object} configObj  Object representing project configuration
   * @param {Object} attributes Object representing user attributes and values which need to be recorded
   */
  getAttributeParams: function(configObj, attributes) {
    var attributeParams = {};
    _.forEach(attributes, function(attributeValue, attributeKey) {
      if (attributeValue || attributeValue === false || attributeValue === 0) {
        var segmentId = configObj.attributeKeyMap[attributeKey].segmentId;
        var segmentParam = sprintf('%s%s', module.exports.urlParams.segmentPrefix, segmentId);
        attributeParams[segmentParam] = attributeValue;
      }
    });
    return attributeParams;
  },

  /**
   * Get impression goal information to the event
   * @param  {Object} configObj     Object representing project configuration
   * @param  {string} experimentKey Experiment which is being activated
   * @return {Object}               Impression goal params with impression goal information
   */
  getImpressionGoalParams: function(configObj, experimentKey) {
    var impressionGoalParams = {};
    var experimentId = projectConfig.getExperimentId(configObj, experimentKey);
    // For tracking impressions, goal ID is set equal to experiment ID of experiment being activated
    impressionGoalParams[module.exports.urlParams.goalId] = experimentId;
    impressionGoalParams[module.exports.urlParams.goalName] = 'visitor-event';
    return impressionGoalParams;
  },

  /**
   * Get conversion goal information to the event
   * @param  {Object} configObj  Object representing project configuration
   * @param  {string} eventKey   Goal key representing the event which needs to be recorded
   * @param  {number} eventValue Value associated with the event. Can be used to represent revenue in cents.
   * @return {Object}            Conversion goal params with conversion goal information
   */
  getConversionGoalParams: function(configObj, eventKey, eventValue) {
    var conversionGoalParams = {};
    var goalId = configObj.eventKeyMap[eventKey].id;
    var eventIds = goalId;
    if (eventValue) {
      eventIds = sprintf('%s,%s', goalId, projectConfig.getRevenueGoalId(configObj));
      conversionGoalParams[module.exports.urlParams.eventValue] = eventValue;
    }
    conversionGoalParams[module.exports.urlParams.goalId] = eventIds;
    conversionGoalParams[module.exports.urlParams.goalName] = eventKey;
    return conversionGoalParams;
  },

  /**
   * Get experiment to variation mapping to the impression event
   * @param  {Object} configObj     Object representing project configuration
   * @param  {string} experimentKey Experiment which is being activated
   * @param  {string} variationId   Experiment which is being activated
   * @return {Object}               Experiment params with experiment to variation mapping for impression events
   */
  getExperimentParams: function(configObj, experimentKey, variationId) {
    var experimentParams = {};
    var experimentId = projectConfig.getExperimentId(configObj, experimentKey);
    var experimentParam = sprintf('%s%s', module.exports.urlParams.experimentPrefix, experimentId);
    experimentParams[experimentParam] = variationId;
    return experimentParams;
  },

  /**
   * Maps experiment and corresponding variation as parameters to be used in the event tracking call
   * @param  {Object} configObj                 Object representing project configuration
   * @param  {Array} variationIds              Experiment(s) which are being tracked
   * @param  {Array}  validExperimentIdsForGoal Array of valid experiment IDs that are associated with the event being tracked
   * @return {Object}                           Experiment variation params with experiment to variation mapping for conversion events
   */
  getExperimentVariationParams: function(configObj, variationIds, validExperimentIdsForGoal) {
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
      var experimentParam = sprintf('%s%s', module.exports.urlParams.experimentPrefix, experimentId);
      var variationId = projectConfig.getEventVariationIdFromExperimentKey(configObj, experimentKey, variationIds);
      experimentVariationParams[experimentParam] = variationId;
    });

    return experimentVariationParams;
  },
};
