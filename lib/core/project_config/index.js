var _ = require('lodash/core');
var keyBy = require('lodash/keyBy');
var cloneDeep = require('lodash/cloneDeep');
var enums = require('../../utils/enums');
var sprintf = require('sprintf');

var EXPERIMENT_RUNNING_STATUS = 'Running';
var MODULE_NAME = 'PROJECT_CONFIG';
var REVENUE_GOAL_KEY = 'Total Revenue';

var ERROR_MESSAGES = enums.ERROR_MESSAGES;

module.exports = {
  /**
   * Creates projectConfig object to be used for quick project property lookup
   * @param  {Object} datafile JSON datafile representing the project
   * @return {Object} Object representing project configuration
   */
  createProjectConfig: function(datafile) {
    var projectConfig = cloneDeep(datafile);

    // Manually parsed for audience targeting
    _.forEach(projectConfig.audiences, function(audience) {
      audience.conditions = JSON.parse(audience.conditions);
    });

    projectConfig.attributeKeyMap = keyBy(projectConfig.dimensions, 'key');
    projectConfig.eventKeyMap = keyBy(projectConfig.events, 'key');
    projectConfig.groupIdMap = keyBy(projectConfig.groups, 'id');

    var experiments;
    _.forEach(projectConfig.groupIdMap, function(group, Id) {
      experiments = cloneDeep(group.experiments);
      _.forEach(experiments, function(experiment) {
        projectConfig.experiments.push(_.assignIn(experiment, {groupId: Id}));
      });
    });

    projectConfig.experimentKeyMap = keyBy(projectConfig.experiments, 'key');
    projectConfig.experimentIdMap = keyBy(projectConfig.experiments, 'id');

    projectConfig.experimentVariationKeyMap = {};
    projectConfig.variationIdMap = {};
    _.forEach(projectConfig.experiments, function(experiment) {
      // Creates { <experimentKey+variationKey>: { key: <variationKey>, id: <variationId> } } mapping for quick lookup
      _.assignIn(projectConfig.experimentVariationKeyMap, module.exports._generateExperimentVariationKeyMap(experiment.variations, experiment.key, 'key'));

      // Creates { <variationId>: { key: <variationKey>, id: <variationId> } } mapping for quick lookup
      _.assignIn(projectConfig.variationIdMap, keyBy(experiment.variations, 'id'));
    });

    return projectConfig;
  },

  /**
   *
   * @param  {Array}  variations    Array of variations within an experiment
   * @param  {string} experimentKey Key of experiment
   * @param  {string} keyString     Key string which will be key in the map
   * @return Map mapping variation's experiment key + variation key to variation
   */
  _generateExperimentVariationKeyMap: function(variations, experimentKey, keyString) {
    var keyMap = {};
    var variation;
    for (var i = 0; i < variations.length; i++) {
      variation = variations[i];
      keyMap[experimentKey + variation[keyString]] = variation;
    }
    return keyMap;
  },

  /**
   * Get experiment ID for the provided experiment key
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} experimentKey Experiment key for which ID is to be determined
   * @return {string} Experiment ID corresponding to the provided experiment key
   * @throws If experiment key is not in datafile
   */
  getExperimentId: function(projectConfig, experimentKey) {
    var experiment = projectConfig.experimentKeyMap[experimentKey];
    if (_.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }
    return experiment.id;
  },

  /**
   * Get experiment status for the provided experiment key
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} experimentKey Experiment key for which status is to be determined
   * @return {string} Experiment status corresponding to the provided experiment key
   * @throws If experiment key is not in datafile
   */
  getExperimentStatus: function(projectConfig, experimentKey) {
    var experiment = projectConfig.experimentKeyMap[experimentKey];
    if (_.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }
    return experiment.status;
  },

  /**
   * Returns whether experiment has a status of 'Running'
   * @param  {Object}  projectConfig Object representing project configuration
   * @param  {string}  experimentKey Experiment key for which status is to be compared with 'Running'
   * @return {Boolean}               true if experiment status is set to 'Running', false otherwise
   */
  isExperimentRunning: function(projectConfig, experimentKey) {
    return module.exports.getExperimentStatus(projectConfig, experimentKey) === EXPERIMENT_RUNNING_STATUS;
  },

  /**
   * Get audiences for the experiment
   * @param  {Object}         projectConfig Object representing project configuration
   * @param  {string}         experimentKey Experiment key for which audience IDs are to be determined
   * @return {Array<Object>}  Audiences corresponding to the experiment
   * @throws If experiment key is not in datafile
   */
  getAudiencesForExperiment: function(projectConfig, experimentKey) {
    var experiment = projectConfig.experimentKeyMap[experimentKey];
    if (_.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }

    var audienceIds = experiment.audienceIds;
    var audiencesInExperiment = [];
    var audiencesInExperiment = _.filter(projectConfig.audiences, function(audience) {
      return audienceIds.indexOf(audience.id) !== -1;
    });
    return audiencesInExperiment;
  },

  /**
   * Get variation key given experiment key and variation ID
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} experimentKey Key representing parent experiment of variation
   * @param  {string} variationId   ID of the variation
   * @return {string} Variation key
   * @throws If experiment key is not in datafile
   */
  getVariationKeyFromId: function(projectConfig, experimentKey, variationId) {
    var experiment = projectConfig.experimentKeyMap[experimentKey];

    if (experiment) {
      var variationMatch = _.find(experiment.variations, function(variation) {
        return variation.id === variationId;
      });
      if (variationMatch) {
        return variationMatch.key;
      }
    } else {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }
  },

  /**
   * Get event variation ID for an experiment from experiment key and event's variation IDs
   * @param {Object}  projectConfig     Object representing project configuration
   * @param {string}  experimentKey     Key representing an experiment that has event
   * @param {Array}   eventVariationIds Variation IDs associated with the event
   * @return {string} Event variation ID
   */
  getEventVariationIdFromExperimentKey: function(projectConfig, experimentKey, eventVariationIds) {
    var experiments = projectConfig.experiments;

    var experiment = _.find(experiments, function(exp) {
      return exp.key === experimentKey;
    });

    var experimentVariationIds = [];
    _.forEach(experiment.variations, function(variation) {
      experimentVariationIds.push(variation.id);
    });

    return _.find(eventVariationIds, function(eventVariationId) {
      return experimentVariationIds.indexOf(eventVariationId) !== -1;
    });
  },

  /**
   * Retrieves all goals in the project except 'Total Revenue'
   * @param  {Object}          projectConfig Object representing project configuration
   * @return {Array<string>}  All goal keys except Total Revenue
   */
  getGoalKeys: function(projectConfig) {
    var goalKeys = Object.keys(projectConfig.eventKeyMap);

    var goalKeysIndex = goalKeys.indexOf(REVENUE_GOAL_KEY);
    if (goalKeysIndex !== -1) {
      goalKeys.splice(goalKeysIndex, 1);
    }

    return goalKeys;
  },

  /**
   * Get ID of the revenue goal for the project
   * @param  {Object} projectConfig Object representing project configuration
   * @return {string} Revenue goal ID
   */
  getRevenueGoalId: function(projectConfig) {
    var revenueGoal = projectConfig.eventKeyMap[REVENUE_GOAL_KEY];
    return revenueGoal ? revenueGoal.id : null;
  },

  /**
   * Get experiment IDs for the provided goal key
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} goalKey Goal key for which experiment IDs are to be retrieved
   * @return {Array<string>}  All experiment IDs for the goal
   * @throws If goal key is not in datafile
   */
  getExperimentIdsForGoal: function(projectConfig, goalKey) {
    var goal = projectConfig.eventKeyMap[goalKey];
    if (goal) {
      if (goal.experimentIds.length > 0) {
        return goal.experimentIds;
      } else {
        return null;
      }
    } else {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EVENT_KEY, MODULE_NAME, goalKey));
    }
  },

  /**
   * Given an experiment key, returns the traffic allocation within that experiment
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} experimentKey Key representing the experiment
   * @return {Array<Object>}  Traffic allocation for the experiment
   * @throws If experiment key is not in datafile
   */
  getTrafficAllocation: function(projectConfig, experimentKey) {
    var experiment = projectConfig.experimentKeyMap[experimentKey];
    if (_.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }
    return experiment.trafficAllocation;
  },
};
