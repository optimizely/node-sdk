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
var fns = require('../../utils/fns');
var enums = require('../../utils/enums');
var sprintf = require('sprintf');

var EXPERIMENT_LAUNCHED_STATUS = 'Launched';
var EXPERIMENT_RUNNING_STATUS = 'Running';
var MODULE_NAME = 'PROJECT_CONFIG';

var ERROR_MESSAGES = enums.ERROR_MESSAGES;
var LOG_MESSAGES = enums.LOG_MESSAGES;
var LOG_LEVEL = enums.LOG_LEVEL;

module.exports = {
  /**
   * Creates projectConfig object to be used for quick project property lookup
   * @param  {Object} datafile JSON datafile representing the project
   * @return {Object} Object representing project configuration
   */
  createProjectConfig: function(datafile) {
    var projectConfig = fns.cloneDeep(datafile);

    // Manually parsed for audience targeting
    fns.forEach(projectConfig.audiences, function(audience) {
      audience.conditions = JSON.parse(audience.conditions);
    });

    projectConfig.attributeKeyMap = fns.keyBy(projectConfig.attributes, 'key');
    projectConfig.eventKeyMap = fns.keyBy(projectConfig.events, 'key');
    projectConfig.groupIdMap = fns.keyBy(projectConfig.groups, 'id');

    var experiments;
    fns.forEach(projectConfig.groupIdMap, function(group, Id) {
      experiments = fns.cloneDeep(group.experiments);
      fns.forEach(experiments, function(experiment) {
        projectConfig.experiments.push(fns.assignIn(experiment, {groupId: Id}));
      });
    });

    projectConfig.experimentKeyMap = fns.keyBy(projectConfig.experiments, 'key');
    projectConfig.experimentIdMap = fns.keyBy(projectConfig.experiments, 'id');

    projectConfig.variationIdMap = {};
    fns.forEach(projectConfig.experiments, function(experiment) {
      // Creates { <variationKey>: <variation> } map inside of the experiment
      experiment.variationKeyMap = fns.keyBy(experiment.variations, 'key');

      // Creates { <variationId>: { key: <variationKey>, id: <variationId> } } mapping for quick lookup
      fns.assignIn(projectConfig.variationIdMap, fns.keyBy(experiment.variations, 'id'));
    });

    projectConfig.forcedVariationMap = {};

    return projectConfig;
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
    if (fns.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }
    return experiment.id;
  },

  /**
   * Get layer ID for the provided experiment key
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} experimentId Experiment ID for which layer ID is to be determined
   * @return {string} Layer ID corresponding to the provided experiment key
   * @throws If experiment key is not in datafile
   */
  getLayerId: function(projectConfig, experimentId) {
    var experiment = projectConfig.experimentIdMap[experimentId];
    if (fns.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_ID, MODULE_NAME, experimentId));
    }
    return experiment.layerId;
  },

  /**
   * Get attribute ID for the provided attribute key
   * @param  {Object}      projectConfig Object representing project configuration
   * @param  {string}      attributeKey  Attribute key for which ID is to be determined
   * @return {string|null} Attribute ID corresponding to the provided attribute key
   */
  getAttributeId: function(projectConfig, attributeKey) {
    var attribute = projectConfig.attributeKeyMap[attributeKey];
    if (attribute) {
      return attribute.id;
    }
    return null;
  },

  /**
   * Get event ID for the provided
   * @param  {Object}      projectConfig Object representing project configuration
   * @param  {string}      eventKey      Event key for which ID is to be determined
   * @return {string|null} Event ID corresponding to the provided event key
   */
  getEventId: function(projectConfig, eventKey) {
    var event = projectConfig.eventKeyMap[eventKey];
    if (event) {
      return event.id;
    }
    return null;
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
    if (fns.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }
    return experiment.status;
  },

  /**
   * Returns whether experiment has a status of 'Running' or 'Launched'
   * @param  {Object}  projectConfig Object representing project configuration
   * @param  {string}  experimentKey Experiment key for which status is to be compared with 'Running'
   * @return {Boolean}               true if experiment status is set to 'Running', false otherwise
   */
  isActive: function(projectConfig, experimentKey) {
    return module.exports.getExperimentStatus(projectConfig, experimentKey) === EXPERIMENT_RUNNING_STATUS ||
      module.exports.getExperimentStatus(projectConfig, experimentKey) === EXPERIMENT_LAUNCHED_STATUS;
  },

  /**
   * Determine for given experiment if event is running, which determines whether should be dispatched or not
   */
  isRunning: function(projectConfig, experimentKey) {
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
    if (fns.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }

    var audienceIds = experiment.audienceIds;
    var audiencesInExperiment = [];
    var audiencesInExperiment = fns.filter(projectConfig.audiences, function(audience) {
      return audienceIds.indexOf(audience.id) !== -1;
    });
    return audiencesInExperiment;
  },

  /**
   * Get variation key given experiment key and variation ID
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} variationId   ID of the variation
   * @return {string} Variation key or null if the variation ID is not found
   */
  getVariationKeyFromId: function(projectConfig, variationId) {
    if (projectConfig.variationIdMap.hasOwnProperty(variationId)) {
      return projectConfig.variationIdMap[variationId].key;
    }
    return null;
  },

  /**
   * Get the variation ID given the experiment key and variation key
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} experimentKey Key of the experiment the variation belongs to
   * @param  {string} variationKey  The variation key
   * @return {string} the variation ID
   */
  getVariationIdFromExperimentAndVariationKey: function(projectConfig, experimentKey, variationKey) {
    var experiment = projectConfig.experimentKeyMap[experimentKey];
    if (experiment.variationKeyMap.hasOwnProperty(variationKey)) {
      return experiment.variationKeyMap[variationKey].id;
    }
    return null;
  },

  /**
   * Get experiment from provided experiment key
   * @param  {Object} projectConfig  Object representing project configuration
   * @param  {string} experimentKey  Event key for which experiment IDs are to be retrieved
   * @return {Object} experiment
   * @throws If experiment key is not in datafile
   */
  getExperimentFromKey: function(projectConfig, experimentKey) {
    if (projectConfig.experimentKeyMap.hasOwnProperty(experimentKey)) {
      var experiment = projectConfig.experimentKeyMap[experimentKey];
      if (!!experiment) {
        return experiment;
      }
    }

    throw new Error(sprintf(ERROR_MESSAGES.EXPERIMENT_KEY_NOT_IN_DATAFILE, MODULE_NAME, experimentKey));
  },


  /**
   * Get experiment IDs for the provided event key
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} eventKey      Event key for which experiment IDs are to be retrieved
   * @return {Array<string>}        All experiment IDs for the event
   * @throws If event key is not in datafile
   */
  getExperimentIdsForEvent: function(projectConfig, eventKey) {
    var event = projectConfig.eventKeyMap[eventKey];
    if (event) {
      if (event.experimentIds.length > 0) {
        return event.experimentIds;
      } else {
        return null;
      }
    } else {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EVENT_KEY, MODULE_NAME, eventKey));
    }
  },

  /**
   * Given an experiment key, returns the traffic allocation within that experiment
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} experimentKey Key representing the experiment
   * @return {Array<Object>}        Traffic allocation for the experiment
   * @throws If experiment key is not in datafile
   */
  getTrafficAllocation: function(projectConfig, experimentKey) {
    var experiment = projectConfig.experimentKeyMap[experimentKey];
    if (fns.isEmpty(experiment)) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, MODULE_NAME, experimentKey));
    }
    return experiment.trafficAllocation;
  },

  /**
   * Removes forced variation for given userId and experimentKey
   * @param  {Object} projectConfig  Object representing project configuration
   * @param  {string} userId         String representing the user id
   * @param  {number} experimentId   Number representing the experiment id
   * @param  {string} experimentKey  Key representing the experiment id
   * @param  {Object} logger
   * @throws If the user id is not valid or not in the forced variation map
   */
  removeForcedVariation: function(projectConfig, userId, experimentId, experimentKey, logger) {
    if (!userId) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_USER_ID, MODULE_NAME));
    }

    if (projectConfig.forcedVariationMap.hasOwnProperty(userId)) {
      delete projectConfig.forcedVariationMap[userId][experimentId];
      logger.log(LOG_LEVEL.DEBUG, sprintf(LOG_MESSAGES.VARIATION_REMOVED_FOR_USER, MODULE_NAME, experimentKey, userId));
    } else {
      throw new Error(sprintf(ERROR_MESSAGES.USER_NOT_IN_FORCED_VARIATION, MODULE_NAME, userId));
    }
  },

  /**
   * Sets forced variation for given userId and experimentKey
   * @param  {Object} projectConfig Object representing project configuration
   * @param  {string} userId        String representing the user id
   * @param  {number} experimentId  Number representing the experiment id
   * @param  {number} variationId   Number representing the variation id
   * @param  {Object} logger
   * @throws If the user id is not valid
   */
  setInForcedVariationMap: function(projectConfig, userId, experimentId, variationId, logger) {
    if (!userId) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_USER_ID, MODULE_NAME));
    }

    if (projectConfig.forcedVariationMap.hasOwnProperty(userId)) {
      projectConfig.forcedVariationMap[userId][experimentId] = variationId;
    } else {
      projectConfig.forcedVariationMap[userId] = {};
      projectConfig.forcedVariationMap[userId][experimentId] = variationId;
    }

    logger.log(LOG_LEVEL.DEBUG, sprintf(LOG_MESSAGES.USER_MAPPED_TO_FORCED_VARIATION, MODULE_NAME, variationId, experimentId, userId));
  },

  /**
   * Gets the forced variation key for the given user and experiment.
   * @param  {Object} projectConfig    Object representing project configuration
   * @param  {string} experimentKey    Key for experiment.
   * @param  {string} userId           The user Id.
   * @param  {Object} logger
   * @return {string|null} Variation   The variation which the given user and experiment should be forced into.
   */
  getForcedVariation: function(projectConfig, experimentKey, userId, logger) {
    var experimentToVariationMap = projectConfig.forcedVariationMap[userId];
    if (!experimentToVariationMap) {
      logger.log(LOG_LEVEL.DEBUG, sprintf(LOG_MESSAGES.USER_HAS_NO_FORCED_VARIATION, MODULE_NAME, userId));
      return null;
    }

    var experimentId;
    try {
      var experiment = this.getExperimentFromKey(projectConfig, experimentKey);
      if (experiment.hasOwnProperty('id')) {
        experimentId = experiment['id'];
      } else {
        // catching improperly formatted experiments
        logger.log(LOG_LEVEL.ERROR, sprintf(ERROR_MESSAGES.IMPROPERLY_FORMATTED_EXPERIMENT, MODULE_NAME, experimentKey));
        return null
      }
    } catch (ex) {
      // catching experiment not in datafile
      logger.log(LOG_LEVEL.ERROR, ex.message);
      return null;
    }

    var variationId = experimentToVariationMap[experimentId];
    if (!variationId) {
      logger.log(LOG_LEVEL.DEBUG, sprintf(LOG_MESSAGES.USER_HAS_NO_FORCED_VARIATION_FOR_EXPERIMENT, MODULE_NAME, experimentKey, userId));
      return null;
    }

    var variationKey = this.getVariationKeyFromId(projectConfig, variationId);
    logger.log(LOG_LEVEL.DEBUG, sprintf(LOG_MESSAGES.USER_HAS_FORCED_VARIATION, MODULE_NAME, variationKey, experimentKey, userId));

    return variationKey;
  },

  /**
   * Sets the forced variation for a user in a given experiment
   * @param  {Object} projectConfig    Object representing project configuration
   * @param {string} experimentKey  Key for experiment.
   * @param {string} userId         The user Id.
   * @param {string} variationKey   Key for variation. If null, then clear the existing experiment-to-variation mapping
   * @param  {Object} logger
   * @return {boolean} A boolean value that indicates if the set completed successfully.
   */
  setForcedVariation: function(projectConfig, experimentKey, userId, variationKey, logger) {
    var experimentId;
    try {
      var experiment = this.getExperimentFromKey(projectConfig, experimentKey);
      if (experiment.hasOwnProperty('id')) {
        experimentId = experiment['id'];
      } else {
        // catching improperly formatted experiments
        logger.log(LOG_LEVEL.ERROR, sprintf(ERROR_MESSAGES.IMPROPERLY_FORMATTED_EXPERIMENT, MODULE_NAME, experimentKey));
        return false;
      }
    } catch (ex) {
      // catching experiment not in datafile
      logger.log(LOG_LEVEL.ERROR, ex.message);
      return false;
    }

    if (!variationKey) {
      try {
        this.removeForcedVariation(projectConfig, userId, experimentId, experimentKey, logger);
        return true;
      } catch (ex) {
        logger.log(LOG_LEVEL.ERROR, ex.message);
        return false;
      }
    }

    var variationId = this.getVariationIdFromExperimentAndVariationKey(projectConfig, experimentKey, variationKey);

    if (!variationId) {
      logger.log(LOG_LEVEL.ERROR, sprintf(ERROR_MESSAGES.NO_VARIATION_FOR_EXPERIMENT_KEY, MODULE_NAME, variationKey, experimentKey));
      return false;
    }

    try {
      this.setInForcedVariationMap(projectConfig, userId, experimentId, variationId, logger);
      return true;
    } catch (ex) {
      logger.log(LOG_LEVEL.ERROR, ex.message);
      return false;
    }
  },
};
