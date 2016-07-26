/**
 * Contains global enums used throughout the library
 */
exports.LOG_LEVEL = {
  NOTSET: 0,
  DEBUG: 1,
  INFO: 2,
  WARNING: 3,
  ERROR: 4,
};

exports.ERROR_MESSAGES = {
  INVALID_ATTRIBUTES: '%s: Provided attributes are in an invalid format.',
  INVALID_BUCKETING_ID: '%s: Unable to generate hash for bucketing ID %s: %s',
  INVALID_DATAFILE: '%s: Datafile is invalid: %s',
  INVALID_JSON: '%s: JSON object is not valid.',
  INVALID_ERROR_HANDLER: '%s: Provided "errorHandler" is in an invalid format.',
  INVALID_EVENT_DISPATCHER: '%s: Provided "eventDispatcher" is in an invalid format.',
  INVALID_EVENT_KEY: '%s: Event key %s is not in datafile.',
  INVALID_EXPERIMENT_KEY: '%s: Experiment key %s is not in datafile.',
  INVALID_GROUP_ID: '%s: Group ID %s is not in datafile.',
  INVALID_LOGGER: '%s: Provided "logger" is in an invalid format.',
  INVALID_USER_ID: '%s: Provided user ID is in an invalid format.',
  JSON_SCHEMA_EXPECTED: '%s: JSON schema expected.',
  NO_DATAFILE_SPECIFIED: '%s: No datafile specified. Cannot start optimizely.',
  NO_JSON_PROVIDED: '%s: No JSON object to validate against schema.',
};

exports.LOG_MESSAGES = {
  ACTIVATE_USER: '%s: Activating user %s in experiment %s.',
  DISPATCH_CONVERSION_EVENT: '%s: Dispatching conversion event to URL %s with params %s.',
  DISPATCH_IMPRESSION_EVENT: '%s: Dispatching impression event to URL %s with params %s.',
  EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS: '%s: Event %s is not associated with any running experiments.',
  EXPERIMENT_NOT_RUNNING: '%s: Experiment %s is not running.',
  FORCED_BUCKETING_FAILED: '%s: Variation key %s is not in datafile. Not activating user %s.',
  NO_VALID_EXPERIMENTS_FOR_GOAL_TO_TRACK: '%s: There are no valid experiments for event %s to track.',
  NOT_ACTIVATING_USER: '%s: Not activating user %s for experiment %s.',
  NOT_TRACKING_USER_FOR_EXPERIMENT: '%s: Not tracking user %s for experiment %s.',
  TRACK_EVENT: '%s: Tracking event %s for user %s.',
  USER_ASSIGNED_TO_VARIATION_BUCKET: '%s: Assigned variation bucket %s to user %s.',
  USER_ASSIGNED_TO_EXPERIMENT_BUCKET: '%s: Assigned experiment bucket %s to user %s.',
  USER_BUCKETED_INTO_EXPERIMENT_IN_GROUP: '%s: User %s is in experiment %s of group %s.',
  USER_NOT_BUCKETED_INTO_EXPERIMENT_IN_GROUP: '%s: User %s is not in experiment %s of group %s.',
  USER_NOT_IN_EXPERIMENT: '%s: User %s is in no experiment.',
  USER_FORCED_IN_VARIATION: '%s: User %s is forced in variation %s.',
  USER_HAS_VARIATION: '%s: User %s is in variation %s of experiment %s.',
  USER_HAS_NO_VARIATION: '%s: User %s is in no variation of experiment %s.',
  USER_NOT_IN_ANY_EXPERIMENT: '%s: User %s is not in any experiment of group %s.',
  USER_NOT_IN_EXPERIMENT: '%s: User %s does not meet conditions to be in experiment %s.',
  VALID_DATAFILE: '%s: Datafile is valid.',
};
