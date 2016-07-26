var _ = require('lodash/core');
var enums = require('../../utils/enums');

/**
 * Default logger implementation
 */
function NoOpLogger() {}

NoOpLogger.prototype.log = function() {};

/**
 * Simple logger implementation
 * @param {Object}  config              Configuration options for the logger
 * @param {Boolean} config.logLevel     The default log level
 * @param {Boolean} config.logToConsole True to log to the console
 * @param {string}  config.prefix       Prefix to prepend to the log message
 */
function Logger(config) {
  config = _.assignIn({
    logLevel: enums.LOG_LEVEL.ERROR,
    logToConsole: true,
    prefix: '[OPTIMIZELY]',
  }, config);

  this.setLogLevel(config.logLevel);
  this.logLevelName = getLogLevelName(config.logLevel);
  this.logToConsole = config.logToConsole;
  this.prefix = config.prefix;
}

/**
 * Log the given message at the specified verbosity
 * @param {string} logLevel   Verbosity level
 * @param {string} logMessage Message to log
 */
Logger.prototype.log = function(logLevel, logMessage) {
  if (this.__shouldLog(logLevel)) {
    if (this.prefix) {
      logMessage = this.prefix + ' - ' + this.logLevelName + ' ' + getTime() + ' ' + logMessage;
    }

    if (this.logToConsole) {
      this.__consoleLog(logLevel, [logMessage]);
    }
  }
};

/**
 * Set the current verbosity level
 * @param {string} logLevel Verbosity level to set the logger to
 */
Logger.prototype.setLogLevel = function(logLevel) {
  this.logLevel = logLevel;
  this.log('Setting log level to ' + logLevel);
};

/**
 * Determine whether we should log based on the current verbosity level
 * @param  {string} targetLogLevel Verbosity level to check against to determine
 *                                 whether we sould log or not
 * @return {Boolean} true if we should log based on the given log level
 * @private
 */
Logger.prototype.__shouldLog = function(targetLogLevel) {
  return targetLogLevel >= this.logLevel;
};

/**
 * Logs to the console
 * @param  {string}        logLevel     Verbosity level to log at
 * @param  {Array<string>} logArguments Array of strings to log (will be concatenated)
 * @private
 */
Logger.prototype.__consoleLog = function(logLevel, logArguments) {
  switch (logLevel) {
    case enums.LOG_LEVEL.DEBUG:
      console.debug.apply(console, logArguments);
      break;
    case enums.LOG_LEVEL.INFO:
      console.log.apply(console, logArguments);
      break;
    case enums.LOG_LEVEL.WARNING:
      console.warn.apply(console, logArguments);
      break;
    case enums.LOG_LEVEL.ERROR:
      console.error.apply(console, logArguments);
      break;
    default:
      console.log.apply(console, logArguments);
  }
};

/**
 * Get log level name
 * @param  {string} logLevel Verbosity level to log at
 * @return {string} String name of log level
 */
function getLogLevelName(logLevel) {
  switch (logLevel) {
    case enums.LOG_LEVEL.DEBUG:
      return 'DEBUG';
    case enums.LOG_LEVEL.INFO:
      return 'INFO';
    case enums.LOG_LEVEL.WARNING:
      return 'WARNING';
    case enums.LOG_LEVEL.ERROR:
      return 'ERROR';
    default:
      return 'NOTSET';
  }
}

/**
 * Get time
 */
function getTime() {
  return new Date();
}

module.exports = {
  createLogger: function(config) {
    return new Logger(config);
  },
  createNoOpLogger: function() {
    return new NoOpLogger();
  },
};
