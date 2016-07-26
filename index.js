var _ = require('lodash');
var configValidator = require('./lib/utils/config_validator');
var defaultErrorHandler = require('./lib/plugins/error_handler');
var defaultEventDispatcher = require('./lib/plugins/event_dispatcher');
var enums = require('./lib/utils/enums');
var logger = require('./lib/plugins/logger');
var sprintf = require('sprintf');

var Optimizely = require('./lib/optimizely');

var MODULE_NAME = 'INDEX';

/**
 * Entry point into the Optimizely Node testing SDK
 */
module.exports = {
  /**
   * Creates an instance of the Optimizely class
   * @param  {Object} config
   * @param  {Object} config.datafile
   * @param  {Object} config.errorHandler
   * @param  {Object} config.eventDispatcher
   * @param  {Object} config.logger
   * @return {Object} the Optimizely object
   */
  createInstance: function(config) {
    var defaultLogger = logger.createNoOpLogger();
    if (config) {
      try {
        configValidator.validate(config);
      } catch (ex) {
        defaultLogger.log(enums.LOG_LEVEL.ERROR, sprintf('%s: %s', MODULE_NAME, ex.message));
      }
    }

    config = _.assign({
      errorHandler: defaultErrorHandler,
      eventDispatcher: defaultEventDispatcher,
      logger: defaultLogger,
    }, config);

    return new Optimizely(config);
  }
};
