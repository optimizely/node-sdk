var _ = require('lodash/core');
var packageJSON = require('../../../package.json');
var sprintf = require('sprintf');

var projectConfig = require('../project_config');

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

  params[urlParams.source] = sprintf('node-sdk-%s', packageJSON.version);
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
 * @param  {string} userId                    ID for user
 * @param  {Object} params                    Object representing event params for conversion event
 * @param  {string} variationIds              Experiment(s) which are being tracked
 * @param  {Array}  validExperimentIdsForGoal Array of valid experiment IDs that are associated with the event being tracked
 * @return {Object}                           Experiment variation params with experiment to variation mapping for conversion events
 */
function getExperimentVariationParams(configObj, userId, variationIds, validExperimentIdsForGoal) {
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

module.exports = {
  /**
   * Get URL for sending impression/conversion event
   * @param  {Object} configObj Object representing project configuration
   * @return {string} URL for the event API
   */
  getUrl: function(configObj) {
    return sprintf('https://%s.log.optimizely.com/event', configObj.projectId);
  },

  /**
   * Create impression event params to be sent to the logging endpoint
   * @param  {Object} configObj     Object representing project configuration
   * @param  {string} experimentKey Experiment for which impression needs to be recorded
   * @param  {string} variationId   ID for variation which would be presented to user
   * @param  {string} userId        ID for user
   * @param  {Object} attributes    Object representing user attributes and values which need to be recorded
   * @return {Object}               Params to be used in impression event logging endpoint call
   */
  createImpressionEventParams: function(configObj, experimentKey, variationId, userId, attributes) {
    var params = getCommonParams(configObj, userId, attributes);
    var impressionGoalParams = getImpressionGoalParams(configObj, experimentKey);
    var experimentParams = getExperimentParams(configObj, experimentKey, variationId);
    return _.assignIn(params, impressionGoalParams, experimentParams);
  },

  /**
   * Create conversion event params to be sent to the logging endpoint
   * @param  {Object} configObj                 Object representing project configuration
   * @param  {string} eventKey                  Goal key representing the event which needs to be recorded
   * @param  {string} userId                    ID for user
   * @param  {Object} attributes                Object representing user attributes and values which need to be recorded
   * @param  {string} eventValue                Value associated with the event. Can be used to represent revenue in cents.
   * @param  {string} variationIds              Experiment(s) which are being tracked
   * @param  {Array}  validExperimentIdsForGoal Array of valid experiment IDs that are associated with the event key
   * @return {Object}                           Params to be used in conversion event logging endpoint call
   */
  createConversionEventParams: function(configObj, eventKey, userId, attributes, eventValue, variationIds, validExperimentIdsForGoal) {
    var params = getCommonParams(configObj, userId, attributes);
    var conversionGoalParams = getConversionGoalParams(configObj, eventKey, eventValue);
    var experimentVariationParams = getExperimentVariationParams(configObj, userId, variationIds, validExperimentIdsForGoal);
    return _.assignIn(params, conversionGoalParams, experimentVariationParams);
  },
};
