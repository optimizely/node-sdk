/**
 * Bucketer API for determining the variation id from the specified parameters
 */
var _ = require('lodash/core');
var enums = require('../../utils/enums');
var murmurhash = require('murmurhash');
var sprintf = require('sprintf');

var ERROR_MESSAGES = enums.ERROR_MESSAGES;
var HASH_SEED = 1;
var LOG_LEVEL = enums.LOG_LEVEL;
var LOG_MESSAGES = enums.LOG_MESSAGES;
var MAX_HASH_VALUE = Math.pow(2, 32);
var MAX_TRAFFIC_VALUE = 10000;
var MODULE_NAME = 'BUCKETER';
var RANDOM_POLICY = 'random';

module.exports = {
  /**
   * Determines ID of variation to be shown for the given input params
   * @param  {Object}         bucketerParams
   * @param  {string}         bucketerParams.experimentId
   * @param  {string}         bucketerParams.experimentKey
   * @param  {string}         bucketerParams.userId
   * @param  {Object<string>} bucketerParams.forcedVariations
   * @param  {Object[]}       bucketerParams.trafficAllocationConfig
   * @param  {Array}          bucketerParams.experimentKeyMap
   * @param  {Object}         bucketerParams.groupIdMap
   * @param  {Object}         bucketerParams.experimentVariationKeyMap
   * @param  {Object}         bucketerParams.variationIdMap
   * @param  {string}         bucketerParams.varationIdMap[].key
   * @param  {Object}         bucketerParams.logger
   * @return Variation ID that user has been bucketed into, null if user is not bucketed into any experiment
   */
  bucket: function(bucketerParams) {
    // Handle forced variations if applicable
    if (!_.isEmpty(bucketerParams.forcedVariations) && bucketerParams.forcedVariations.hasOwnProperty(bucketerParams.userId)) {
      return module.exports._forcedBucketing(bucketerParams.userId,
                                             bucketerParams.forcedVariations,
                                             bucketerParams.experimentKey,
                                             bucketerParams.experimentVariationKeyMap,
                                             bucketerParams.logger);
    }

    // Check if user is in a random group; if so, check if user is bucketed into a specific experiment
    var experiment = bucketerParams.experimentKeyMap[bucketerParams.experimentKey];
    var groupId = experiment['groupId'];
    if (groupId) {
      var group = bucketerParams.groupIdMap[groupId];
      if (!group) {
        throw new Error(sprintf(ERROR_MESSAGES.INVALID_GROUP_ID, MODULE_NAME, groupId));
      }
      if (group.policy === RANDOM_POLICY) {
        var bucketedExperimentId = module.exports._bucketUserIntoExperiment(group,
                                                                          bucketerParams.userId,
                                                                          bucketerParams.experimentId,
                                                                          bucketerParams.logger);

        // Return if user is not bucketed into any experiment
        if (bucketedExperimentId === null) {
          var notbucketedInAnyExperimentLogMessage = sprintf(LOG_MESSAGES.USER_NOT_IN_ANY_EXPERIMENT, MODULE_NAME, bucketerParams.userId, groupId);
          bucketerParams.logger.log(LOG_LEVEL.INFO, notbucketedInAnyExperimentLogMessage);
          return null;
        }

        // Return if user is bucketed into a different experiment than the one specified
        if (bucketedExperimentId !== bucketerParams.experimentId) {
          var notBucketedIntoExperimentOfGroupLogMessage = sprintf(LOG_MESSAGES.USER_NOT_BUCKETED_INTO_EXPERIMENT_IN_GROUP, MODULE_NAME, bucketerParams.userId, bucketerParams.experimentKey, groupId);
          bucketerParams.logger.log(LOG_LEVEL.INFO, notBucketedIntoExperimentOfGroupLogMessage);
          return null;
        }

        // Continue bucketing if user is bucketed into specified experiment
        var bucketedIntoExperimentOfGroupLogMessage = sprintf(LOG_MESSAGES.USER_BUCKETED_INTO_EXPERIMENT_IN_GROUP, MODULE_NAME, bucketerParams.userId, bucketerParams.experimentKey, groupId);
        bucketerParams.logger.log(LOG_LEVEL.INFO, bucketedIntoExperimentOfGroupLogMessage);
      }
    }

    var bucketingId = sprintf('%s%s', bucketerParams.userId, bucketerParams.experimentId);
    var bucketValue = module.exports._generateBucketValue(bucketingId);

    var bucketedUserLogMessage = sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_VARIATION_BUCKET, MODULE_NAME, bucketValue, bucketerParams.userId);
    bucketerParams.logger.log(LOG_LEVEL.DEBUG, bucketedUserLogMessage);

    var entityId = module.exports._findBucket(bucketValue, bucketerParams.trafficAllocationConfig);

    if (entityId === null) {
      var userHasNoVariationLogMessage = sprintf(LOG_MESSAGES.USER_HAS_NO_VARIATION, MODULE_NAME, bucketerParams.userId, bucketerParams.experimentKey);
      bucketerParams.logger.log(LOG_LEVEL.INFO, userHasNoVariationLogMessage);
    } else {
      var variationKey = bucketerParams.variationIdMap[entityId].key;
      var userInVariationLogMessage = sprintf(LOG_MESSAGES.USER_HAS_VARIATION, MODULE_NAME, bucketerParams.userId, variationKey, bucketerParams.experimentKey);
      bucketerParams.logger.log(LOG_LEVEL.INFO, userInVariationLogMessage);
    }

    return entityId;
  },

  /**
   * Returns a forced bucketing variation
   * @param {string} userId                         ID of user to be bucketed into forced variation
   * @param {Object} forcedVariations               Key:value pairs of user IDs to variation that user should be bucketed into
   * @param {string} experimentKey                  Key of experiment
   * @param {Object} experimentVariationKeyMap      Mapping of variation's experiment key + variation key to variation
   * @param {string} experimentVariationKeyMap[].id ID of variation user should be bucketed into
   * @param {Object} logger                         Logger implementation
   * @return ID of forced variation key if variation is in datafile, null otherwise
   */
  _forcedBucketing: function(userId, forcedVariations, experimentKey, experimentVariationKeyMap, logger) {
    var forcedVariationKey = forcedVariations[userId];
    var experimentVariationKey = experimentKey + forcedVariationKey;
    if (experimentVariationKeyMap.hasOwnProperty(experimentVariationKey)) {
      var forcedBucketingSucceededMessageLog = sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, MODULE_NAME, userId, forcedVariationKey);
      logger.log(LOG_LEVEL.INFO, forcedBucketingSucceededMessageLog);
      return experimentVariationKeyMap[experimentVariationKey].id;
    } else {
      var forcedBucketingFailedMessageLog = sprintf(LOG_MESSAGES.FORCED_BUCKETING_FAILED, MODULE_NAME, forcedVariationKey, userId);
      logger.log(LOG_LEVEL.ERROR, forcedBucketingFailedMessageLog);
      return null;
    }
  },

  /**
   * Returns bucketed experiment ID to compare against experiment user is being called into
   * @param {Object} group        Group that experiment is in
   * @param {string} userId       ID of user to be bucketed into experiment
   * @param {string} experimentId ID of experiment
   * @param {Object} logger       Logger implementation
   * @return {string} ID of experiment if user is bucketed into experiment within the group, null otherwise
   */
  _bucketUserIntoExperiment: function(group, userId, experimentId, logger) {
    var bucketedExperimentId = null;
    var bucketingId = sprintf('%s%s', userId, group.id);
    var bucketValue = module.exports._generateBucketValue(bucketingId);
    logger.log(LOG_LEVEL.DEBUG, sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_EXPERIMENT_BUCKET, MODULE_NAME, bucketValue, userId));
    var trafficAllocationConfig = group.trafficAllocation;
    bucketedExperimentId = module.exports._findBucket(bucketValue, trafficAllocationConfig);
    return bucketedExperimentId;
  },

  /**
   * Returns entity ID associated with bucket value
   * @param  {string}   bucketValue
   * @param  {Object[]} trafficAllocationConfig
   * @param  {number}   trafficAllocationConfig[].endOfRange
   * @param  {number}   trafficAllocationConfig[].entityId
   * @return {string}   Entity ID for bucketing if bucket value is within traffic allocation boundaries, null otherwise
   */
  _findBucket: function(bucketValue, trafficAllocationConfig) {
    var entityId = null;
    for (var i = 0; i < trafficAllocationConfig.length; i++) {
      if (bucketValue < trafficAllocationConfig[i].endOfRange) {
        entityId = trafficAllocationConfig[i].entityId;
        break;
      }
    }
    return entityId;
  },

  /**
   * Helper function to generate bucket value in half-closed interval [0, MAX_TRAFFIC_VALUE)
   * @param  {string} bucketingId String ID for bucketing
   * @return {string} the generated bucket value
   * @throws If bucketing ID is not a valid string
   */
  _generateBucketValue: function(bucketingId) {
    try {
      // NOTE: the mmh library already does cast the hash value as an unsigned 32bit int
      // https://github.com/perezd/node-murmurhash/blob/master/murmurhash.js#L115
      var hashValue = murmurhash.v3(bucketingId, HASH_SEED);
      var ratio = hashValue / MAX_HASH_VALUE;
      return parseInt(ratio * MAX_TRAFFIC_VALUE, 10);
    } catch (ex) {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_BUCKETING_ID, MODULE_NAME, bucketingId, ex.message));
    }
  },
};
