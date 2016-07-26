var logger = require('./');
var chai = require('chai');
var enums = require('../../utils/enums');
var assert = chai.assert;
var expect = chai.expect;
var sinon = require('sinon');

var LOG_LEVEL = enums.LOG_LEVEL;
describe('lib/plugins/logger', function() {
  describe('APIs', function() {
    var defaultLogger;
    describe('createLogger', function() {
      it('should return an instance of the default logger', function() {
        defaultLogger = logger.createLogger({logLevel: LOG_LEVEL.NOTSET});
        assert.isObject(defaultLogger);
        expect(defaultLogger.logLevel).to.equal(LOG_LEVEL.NOTSET);
      });
    });

    describe('log', function() {
      beforeEach(function() {
        defaultLogger = logger.createLogger({logLevel: LOG_LEVEL.INFO});
        sinon.stub(defaultLogger, '__consoleLog');
      });

      it('should log the given message', function() {
        defaultLogger.log(LOG_LEVEL.INFO, 'message');
        assert.isTrue(defaultLogger.__consoleLog.calledOnce);
        assert.notStrictEqual(defaultLogger.__consoleLog.firstCall.args, [LOG_LEVEL.INFO, ['message']]);
      });

      it('should not log the message if the log level is lower than the current log level', function() {
        defaultLogger.log(LOG_LEVEL.DEBUG, 'message');
        assert.isTrue(defaultLogger.__consoleLog.notCalled);
      });
    });

    describe('setLogLevel', function() {
      beforeEach(function() {
        defaultLogger = logger.createLogger({logLevel: LOG_LEVEL.NOTSET});
      });

      it('should set the log level to the specified log level', function() {
        expect(defaultLogger.logLevel).to.equal(LOG_LEVEL.NOTSET);

        defaultLogger.setLogLevel(LOG_LEVEL.DEBUG);
        expect(defaultLogger.logLevel).to.equal(LOG_LEVEL.DEBUG);

        defaultLogger.setLogLevel(LOG_LEVEL.INFO);
        expect(defaultLogger.logLevel).to.equal(LOG_LEVEL.INFO);
      });
    });
  });
});
