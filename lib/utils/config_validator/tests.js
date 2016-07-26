var chai = require('chai');
var assert = chai.assert;
var configValidator = require('./');
var sprintf = require('sprintf');

var ERROR_MESSAGES = require('../enums').ERROR_MESSAGES;

describe('lib/utils/config_validator', function() {
  describe('APIs', function() {
    describe('validate', function() {
      it('should complain if the provided error handler is invalid', function() {
        assert.throws(function() {
          configValidator.validate({
            errorHandler: {},
          });
        }, sprintf(ERROR_MESSAGES.INVALID_ERROR_HANDLER, 'CONFIG_VALIDATOR'));
      });

      it('should complain if the provided event dispatcher is invalid', function() {
        assert.throws(function() {
          configValidator.validate({
            eventDispatcher: {},
          });
        }, sprintf(ERROR_MESSAGES.INVALID_EVENT_DISPATCHER, 'CONFIG_VALIDATOR'));
      });

      it('should complain if the provided logger is invalid', function() {
        assert.throws(function() {
          configValidator.validate({
            logger: {},
          });
        }, sprintf(ERROR_MESSAGES.INVALID_LOGGER, 'CONFIG_VALIDATOR'));
      });
    });
  });
});
