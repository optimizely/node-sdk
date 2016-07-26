var configValidator = require('./lib/utils/config_validator');
var enums = require('./lib/utils/enums');
var logger = require('./lib/plugins/logger');
var Optimizely = require('./lib/optimizely');
var optimizelyFactory = require('./');

var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

describe('optimizelyFactory', function() {
  describe('APIs', function() {
    describe('createInstance', function() {
      var fakeErrorHandler = { handleError: function() {}};
      var fakeEventDispatcher = { dispatchEvent: function() {}};
      var fakeLogger = { log: function() {}};

      beforeEach(function() {
        sinon.spy(console, 'error');
        sinon.stub(configValidator, 'validate');
      });

      afterEach(function() {
        console.error.restore();
        configValidator.validate.restore();
      });

      it('should not throw if the provided config is not valid and call console.error if simple logger is used', function() {
        configValidator.validate.throws(new Error('Invalid config or something'));
        assert.doesNotThrow(function() {
          optimizelyFactory.createInstance({
            datafile: {},
            logger: logger.createLogger({ logLevel: enums.LOG_LEVEL.INFO }),
          });
        });
        assert.isTrue(console.error.called);
      });

      it('should not throw if the provided config is not valid and not call console.error if default (no-op) logger is used', function() {
        configValidator.validate.throws(new Error('Invalid config or something'));
        assert.doesNotThrow(function() {
          optimizelyFactory.createInstance({
            datafile: {},
          });
        });
        assert.isFalse(console.error.called);
      });

      it('should create an instance of optimizely', function() {
        var optlyInstance = optimizelyFactory.createInstance({
          datafile: {},
          errorHandler: fakeErrorHandler,
          eventDispatcher: fakeEventDispatcher,
          logger: fakeLogger,
        });

        assert.instanceOf(optlyInstance, Optimizely);
      });
    });
  });
});
