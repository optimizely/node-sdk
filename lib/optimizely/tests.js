var Optimizely = require('./');
var bluebird = require('bluebird');
var bucketer = require('../core/bucketer');
var enums = require('../utils/enums');
var eventDispatcher = require('../plugins/event_dispatcher');
var errorHandler = require('../plugins/error_handler');
var jsonSchemaValidator = require('../utils/json_schema_validator');
var logger = require('../plugins/logger');
var packageJSON = require('../../package.json');
var testData = require('../../tests/test_data');

var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');
var sprintf = require('sprintf');

var ERROR_MESSAGES = enums.ERROR_MESSAGES;
var LOG_LEVEL = enums.LOG_LEVEL;
var LOG_MESSAGES = enums.LOG_MESSAGES;

describe('lib/optimizely', function() {
  describe('constructor', function() {
    var stubErrorHandler = { handleError: function() {}};
    var stubEventDispatcher = { dispatchEvent: function() { return bluebird.resolve(null); } };
    var createdLogger = logger.createLogger({logLevel: LOG_LEVEL.INFO});
    beforeEach(function() {
      sinon.stub(stubErrorHandler, 'handleError');
      sinon.stub(createdLogger, 'log');
    });

    afterEach(function() {
      stubErrorHandler.handleError.restore();
      createdLogger.log.restore();
    });

    it('should construct an instance of the Optimizely class for Classic Optimizely', function() {
      var optlyInstance = new Optimizely({
        datafile: testData.getTestProjectConfig(),
        errorHandler: stubErrorHandler,
        eventDispatcher: stubEventDispatcher,
        logger: createdLogger,
      });
      assert.instanceOf(optlyInstance, Optimizely);

      sinon.assert.calledOnce(createdLogger.log);
      var logMessage = createdLogger.log.args[0][1];
      assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.VALID_DATAFILE, 'OPTIMIZELY'));
    });

    it('should construct an instance of the Optimizely class for New Optimizely', function() {
      var optlyInstance = new Optimizely({
        datafile: testData.getTestProjectConfigNewOptly(),
        errorHandler: stubErrorHandler,
        eventDispatcher: stubEventDispatcher,
        logger: createdLogger,
      });
      assert.instanceOf(optlyInstance, Optimizely);

      sinon.assert.calledOnce(createdLogger.log);
      var logMessage = createdLogger.log.args[0][1];
      assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.VALID_DATAFILE, 'OPTIMIZELY'));
    });

    it('should throw an error if a datafile is not passed into the constructor', function() {
      new Optimizely({
        errorHandler: stubErrorHandler,
        logger: createdLogger,
      });
      sinon.assert.calledOnce(stubErrorHandler.handleError);
      var errorMessage = stubErrorHandler.handleError.lastCall.args[0].message;
      assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, 'OPTIMIZELY'));

      sinon.assert.calledOnce(createdLogger.log);
      var logMessage = createdLogger.log.args[0][1];
      assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, 'OPTIMIZELY'));
    });

    it('should throw an error if the datafile is not valid', function() {
      var invalidDatafile = testData.getTestProjectConfig();
      delete invalidDatafile['projectId'];

      new Optimizely({
        errorHandler: stubErrorHandler,
        datafile: invalidDatafile,
        logger: createdLogger,
      });
      sinon.assert.calledOnce(stubErrorHandler.handleError);
      var errorMessage = stubErrorHandler.handleError.lastCall.args[0].message;
      assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_DATAFILE, 'JSON_SCHEMA_VALIDATOR', 'instance requires property "projectId"'));

      sinon.assert.calledOnce(createdLogger.log);
      var logMessage = createdLogger.log.args[0][1];
      assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_DATAFILE, 'JSON_SCHEMA_VALIDATOR', 'instance requires property "projectId"'));
    });

    describe('skipping JSON schema validation', function() {
      beforeEach(function() {
        sinon.spy(jsonSchemaValidator, 'validate');
      });

      afterEach(function() {
        jsonSchemaValidator.validate.restore();
      });

      it('should skip JSON schema validation if skipJSONValidation is passed into instance args with `true` value', function() {
        new Optimizely({
          datafile: testData.getTestProjectConfig(),
          errorHandler: stubErrorHandler,
          eventDispatcher: stubEventDispatcher,
          logger: createdLogger,
          skipJSONValidation: true,
        });

        sinon.assert.notCalled(jsonSchemaValidator.validate);
        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.SKIPPING_JSON_VALIDATION, 'OPTIMIZELY'));
      });

      it('should not skip JSON schema validation if skipJSONValidation is passed into instance args with a value other than true', function() {
        new Optimizely({
          datafile: testData.getTestProjectConfig(),
          errorHandler: stubErrorHandler,
          eventDispatcher: stubEventDispatcher,
          logger: createdLogger,
          skipJSONValidation: 'hi',
        });

        sinon.assert.calledOnce(jsonSchemaValidator.validate);
        sinon.assert.calledOnce(createdLogger.log);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.VALID_DATAFILE, 'OPTIMIZELY'));
      });
    });
  });

  describe('APIs', function() {
    var optlyInstance;
    var bucketStub;

    var url = 'https://111001.log.optimizely.com/event';

    var createdLogger = logger.createLogger({logLevel: LOG_LEVEL.INFO});
    beforeEach(function() {
      optlyInstance = new Optimizely({
        datafile: testData.getTestProjectConfig(),
        errorHandler: errorHandler,
        eventDispatcher: eventDispatcher,
        logger: createdLogger,
      });
      bucketStub = sinon.stub(bucketer, 'bucket');
      sinon.stub(eventDispatcher, 'dispatchEvent').returns(bluebird.resolve());
      sinon.stub(errorHandler, 'handleError');
      sinon.stub(createdLogger, 'log');
    });

    afterEach(function() {
      bucketer.bucket.restore();
      eventDispatcher.dispatchEvent.restore();
      errorHandler.handleError.restore();
      createdLogger.log.restore();
    });

    describe('activate', function() {
      it('should call bucketer and dispatchEvent with proper args and return variation key', function() {
        bucketStub.returns('111129');
        // activate without attributes
        var activate1 = optlyInstance.activate('testExperiment', 'testUser');

        bucketStub.returns('122229');
        // activate with attributes
        var activate2 = optlyInstance.activate('testExperimentWithAudiences', 'testUser', {browser_type: 'firefox'});

        sinon.assert.calledTwice(bucketer.bucket);
        sinon.assert.calledTwice(eventDispatcher.dispatchEvent);
        sinon.assert.calledTwice(createdLogger.log);

        var expectedParams1 = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            a: '111001',
            d: '12001',
            u: 'testUser',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0),
            g: '111127',
            n: 'visitor-event',
            'x111127': '111129',
          },
        };
        var eventDispatcherCall1 = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall1[0], expectedParams1);

        var expectedParams2 = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            a: '111001',
            d: '12001',
            u: 'testUser',
            's5175100584230912': 'firefox',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0),
            g: '122227',
            n: 'visitor-event',
            'x122227': '122229',
          },
        };
        var eventDispatcherCall2 = eventDispatcher.dispatchEvent.args[1];
        assert.deepEqual(eventDispatcherCall2[0], expectedParams2);

        var expectedVariation1 = 'variation';
        var expectedVariation2 = 'variationWithAudience';

        assert.strictEqual(expectedVariation1, activate1);
        assert.strictEqual(expectedVariation2, activate2);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                                'OPTIMIZELY',
                                                url,
                                                JSON.stringify(expectedParams1.params)));

        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                                'OPTIMIZELY',
                                                url,
                                                JSON.stringify(expectedParams2.params)));
      });

      it('should return variation key if user is in grouped experiment', function() {
        bucketStub.returns('662');
        assert.strictEqual(optlyInstance.activate('groupExperiment2', 'testUser'), 'var2exp2');
        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedParams = {
          a: '111001',
          d: '12001',
          u: 'testUser',
          src: sprintf('node-sdk-%s', packageJSON.version),
          time: Math.round(new Date().getTime() / 1000.0),
          g: '443',
          n: 'visitor-event',
          'x443': '662'
        };

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                               'OPTIMIZELY',
                                               url,
                                               JSON.stringify(expectedParams)));
      });

      it('should return variation key if user is in grouped experiment and is in audience', function() {
        bucketStub.returns('552');
        assert.strictEqual(optlyInstance.activate('groupExperiment1', 'testUser', {browser_type: 'firefox'}), 'var2exp1');
        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedParams = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            a: '111001',
            d: '12001',
            u: 'testUser',
            's5175100584230912': 'firefox',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0),
            g: '442',
            n: 'visitor-event',
            'x442': '552',
          }
        };

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedParams.url,
                                               JSON.stringify(expectedParams.params)));
      });

      it('should not make a dispatch event call if variation ID is null', function() {
        bucketStub.returns(null);
        assert.isNull(optlyInstance.activate('testExperiment', 'testUser'));
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'testExperiment'));
      });

      it('should return null if user is not in audience', function() {
        // experiment not in group
        assert.isNull(optlyInstance.activate('testExperimentWithAudiences', 'testUser', {browser_type: 'chrome'}));

        // experiment in group
        assert.isNull(optlyInstance.activate('groupExperiment1', 'testUser', {browser_type: 'chrome'}));

        sinon.assert.callCount(createdLogger.log, 4);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));

        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));

        var logMessage3 = createdLogger.log.args[2][1];
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'groupExperiment1'));

        var logMessage4 = createdLogger.log.args[3][1];
        assert.strictEqual(logMessage4, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'groupExperiment1'));
      });

      it('should return null if experiment is not running', function() {
        assert.isNull(optlyInstance.activate('testExperimentNotRunning', 'testUser'));
        sinon.assert.calledTwice(createdLogger.log);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'OPTIMIZELY', 'testExperimentNotRunning'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'testExperimentNotRunning'));
      });

      it('should throw an error for invalid user ID', function() {
        assert.isNull(optlyInstance.activate('testExperiment', null));

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));

        sinon.assert.calledTwice(createdLogger.log);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'null', 'testExperiment'));
      });

      it('should throw an error for invalid experiment key', function() {
        assert.isNull(optlyInstance.activate('invalidExperimentKey', 'testUser'));

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'OPTIMIZELY', 'invalidExperimentKey'));

        sinon.assert.calledTwice(createdLogger.log);
        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'OPTIMIZELY', 'invalidExperimentKey'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'invalidExperimentKey'));
      });

      it('should throw an error for invalid attributes', function() {
        assert.isNull(optlyInstance.activate('testExperimentWithAudiences', 'testUser', []));

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));

        sinon.assert.calledTwice(createdLogger.log);
        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));
      });

      it('should activate when logger is in DEBUG mode', function() {
        var optlyInstance = new Optimizely({
          datafile: testData.getTestProjectConfig(),
          errorHandler: errorHandler,
          eventDispatcher: eventDispatcher,
          logger: logger.createLogger({logLevel: 1}),
        });

        optlyInstance.activate('testExperiment', 'testUser');
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
      });

      describe('forced variations', function() {
        beforeEach(function() {
          sinon.spy(Optimizely.prototype, '__validateInputs');
          sinon.stub(Optimizely.prototype, '__validatePreconditions');
        });

        afterEach(function() {
          Optimizely.prototype.__validateInputs.restore();
          Optimizely.prototype.__validatePreconditions.restore();
        });

        it('should return forced variation before doing experiment status or audience checks', function() {
          var activate = optlyInstance.activate('testExperiment', 'user1');
          assert.strictEqual(activate, 'control');

          sinon.assert.calledOnce(Optimizely.prototype.__validateInputs);
          sinon.assert.notCalled(Optimizely.prototype.__validatePreconditions);
        });
      });

      describe('activate in New Optimizely', function() {
        it('should activate when logger is in DEBUG mode', function() {
          var optlyInstance = new Optimizely({
            datafile: testData.getTestProjectConfigNewOptly(),
            errorHandler: errorHandler,
            eventDispatcher: eventDispatcher,
            logger: logger.createLogger({logLevel: 1}),
          });

          optlyInstance.activate('testExperiment', 'testUser');
          sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        });
      });
    });

    describe('track', function() {
      it('should call bucketer and dispatchEvent with proper args', function() {
        bucketStub.returns('111129');
        optlyInstance.track('testEvent', 'testUser');

        bucketStub.returns('122229');
        optlyInstance.track('testEventWithAudiences', 'testUser', {browser_type: 'firefox'});

        bucketStub.returns('111129');
        optlyInstance.track('testEvent', 'testUser', undefined, 4200);

        sinon.assert.calledThrice(bucketer.bucket);
        sinon.assert.calledThrice(eventDispatcher.dispatchEvent);
        sinon.assert.calledThrice(createdLogger.log);

        // track event without attributes or event value
        var expectedParams1 = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            a: '111001',
            d: '12001',
            u: 'testUser',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0),
            g: '111095',
            n: 'testEvent',
            'x111127': '111129',
          },
        };
        var eventDispatcherCall1 = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall1[0], expectedParams1);

        // track event with attributes
        var expectedParams2 = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            a: '111001',
            d: '12001',
            u: 'testUser',
            's5175100584230912': 'firefox',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0),
            g: '111097',
            n: 'testEventWithAudiences',
            'x122227': '122229',
          }
        };
        var eventDispatcherCall2 = eventDispatcher.dispatchEvent.args[1];
        assert.deepEqual(eventDispatcherCall2[0], expectedParams2);

        // track event with event value
        var expectedParams3 = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            a: '111001',
            d: '12001',
            u: 'testUser',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0),
            v: 4200,
            g: '111095,111096',
            n: 'testEvent',
            'x111127': '111129',
          }
        };
        var eventDispatcherCall3 = eventDispatcher.dispatchEvent.args[2];
        assert.deepEqual(eventDispatcherCall3[0], expectedParams3);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                                'OPTIMIZELY',
                                                url,
                                                JSON.stringify(expectedParams1.params)));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                                'OPTIMIZELY',
                                                url,
                                                JSON.stringify(expectedParams2.params)));
        var logMessage3 = createdLogger.log.args[2][1];
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                                'OPTIMIZELY',
                                                url,
                                                JSON.stringify(expectedParams3.params)));
      });

      it('should not track a user for an experiment not running', function() {
        optlyInstance.track('testEventWithExperimentNotRunning', 'testUser');
        sinon.assert.notCalled(bucketer.bucket);
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledThrice(createdLogger.log);
        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'OPTIMIZELY', 'testExperimentNotRunning'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentNotRunning'));
        var logMessage3 = createdLogger.log.args[2][1];
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.NO_VALID_EXPERIMENTS_FOR_EVENT_TO_TRACK, 'OPTIMIZELY', 'testEventWithExperimentNotRunning'));
      });

      it('should not track a user when user is not in the audience of the experiment', function() {
        optlyInstance.track('testEventWithAudiences', 'testUser', {browser_type: 'chrome'});
        sinon.assert.notCalled(bucketer.bucket);
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledThrice(createdLogger.log);
        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));
        var logMessage3 = createdLogger.log.args[2][1];
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.NO_VALID_EXPERIMENTS_FOR_EVENT_TO_TRACK, 'OPTIMIZELY', 'testEventWithAudiences'));
      });

      it('should not track a user when the event has no associated experiments', function() {
        optlyInstance.track('testEventWithoutExperiments', 'testUser');
        sinon.assert.notCalled(bucketer.bucket);
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS, 'OPTIMIZELY', 'testEventWithoutExperiments'));
      });

      it('should only track a user for experiments where they are in the audience and where the experiment is running', function() {
        var expectedParams = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            a: '111001',
            d: '12001',
            u: 'testUser',
            's5175100584230912': 'firefox',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0),
            g: '111100',
            n: 'testEventWithMultipleExperiments',
            'x111127': '111129', // experiment without audiences
            'x122227': '122229', // experiment with proper audience match
          },
        };

        bucketStub.onCall(0).returns('111129');
        bucketStub.onCall(1).returns('122229');
        // Of the 3 experiments attached to the event, 2 are sent in conversion event (one without audiences and one with proper audience are in - one with experiment not running is left out)
        optlyInstance.track('testEventWithMultipleExperiments', 'testUser', {browser_type: 'firefox'});

        sinon.assert.calledTwice(bucketStub);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);

        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedParams);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'OPTIMIZELY', 'testExperimentNotRunning'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentNotRunning'));
        var logMessage3 = createdLogger.log.args[2][1];
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                                'OPTIMIZELY',
                                                url,
                                                JSON.stringify(expectedParams.params)));
      });

      it('should throw an error for invalid user ID', function() {
        optlyInstance.track('testEvent', null);

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));
      });

      it('should throw an error for invalid event key', function() {
        optlyInstance.track('invalidEventKey', 'testUser');

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_EVENT_KEY, 'PROJECT_CONFIG', 'invalidEventKey'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_EVENT_KEY, 'PROJECT_CONFIG', 'invalidEventKey'));
      });

      it('should throw an error for invalid attributes', function() {
        optlyInstance.track('testEvent', 'testUser', []);

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));
      });

      it('should not throw an error for an event key without associated experiment IDs', function() {
        optlyInstance.track('testEventWithoutExperiments', 'testUser');
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
        sinon.assert.notCalled(errorHandler.handleError);

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS, 'OPTIMIZELY', 'testEventWithoutExperiments'));
      });

      it('should track when logger is in DEBUG mode', function() {
        var optlyInstance = new Optimizely({
          datafile: testData.getTestProjectConfig(),
          errorHandler: errorHandler,
          eventDispatcher: eventDispatcher,
          logger: logger.createLogger({logLevel: 1}),
        });

        optlyInstance.track('testEvent', 'testUser');
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
      });

      describe('forced variations', function() {
        beforeEach(function() {
          sinon.spy(Optimizely.prototype, '__validateInputs');
          sinon.stub(Optimizely.prototype, '__validatePreconditions');
        });

        afterEach(function() {
          Optimizely.prototype.__validateInputs.restore();
          Optimizely.prototype.__validatePreconditions.restore();
        });

        it('should return forced variation before doing experiment status or audience checks when looping through valid experiments', function() {
          optlyInstance.track('testEvent', 'user1');

          sinon.assert.calledOnce(Optimizely.prototype.__validateInputs);
          sinon.assert.notCalled(Optimizely.prototype.__validatePreconditions);
        });
      });

      describe('track in New Optimizely', function() {
        it('should track when logger is in DEBUG mode', function() {
          var optlyInstance = new Optimizely({
            datafile: testData.getTestProjectConfigNewOptly(),
            errorHandler: errorHandler,
            eventDispatcher: eventDispatcher,
            logger: logger.createLogger({logLevel: 1}),
          });

          optlyInstance.track('testEvent', 'testUser');
          sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        });
      });
    });

    describe('getVariation', function() {
      it('should call bucketer and return variation key', function() {
        var expected1 = 'variation';

        bucketStub.returns('111129');
        // get variation without attributes
        var getVariation1 = optlyInstance.getVariation('testExperiment', 'testUser');

        var expected2 = 'variationWithAudience';

        bucketStub.returns('122229');
        // get variation with attributes
        var getVariation2 = optlyInstance.getVariation('testExperimentWithAudiences',
                                                       'testUser',
                                                       {browser_type: 'firefox'});


        assert.strictEqual(expected1, getVariation1);
        assert.strictEqual(expected2, getVariation2);
        sinon.assert.calledTwice(bucketer.bucket);
        sinon.assert.notCalled(createdLogger.log);
      });

      it('should return null if user is not in audience or experiment is not running', function() {
        var getVariationReturnsNull1 = optlyInstance.getVariation('testExperimentWithAudiences', 'testUser', {});
        var getVariationReturnsNull2 = optlyInstance.getVariation('testExperimentNotRunning', 'testUser');

        assert.isNull(getVariationReturnsNull1);
        assert.isNull(getVariationReturnsNull2);

        sinon.assert.notCalled(bucketer.bucket);
        sinon.assert.calledTwice(createdLogger.log);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'OPTIMIZELY', 'testExperimentNotRunning'));
      });

      it('should throw an error for invalid user ID', function() {
        var getVariationWithError = optlyInstance.getVariation('testExperiment', null);

        assert.isNull(getVariationWithError);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));
      });

      it('should throw an error for invalid experiment key', function() {
        var getVariationWithError = optlyInstance.getVariation('invalidExperimentKey', 'testUser');

        assert.isNull(getVariationWithError);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'OPTIMIZELY', 'invalidExperimentKey'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'OPTIMIZELY', 'invalidExperimentKey'));
      });

      it('should throw an error for invalid attributes', function() {
        var getVariationWithError = optlyInstance.getVariation('testExperimentWithAudiences', 'testUser', []);

        assert.isNull(getVariationWithError);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));
      });

      describe('forced variations', function() {
        beforeEach(function() {
          sinon.spy(Optimizely.prototype, '__validateInputs');
          sinon.stub(Optimizely.prototype, '__validatePreconditions');
        });

        afterEach(function() {
          Optimizely.prototype.__validateInputs.restore();
          Optimizely.prototype.__validatePreconditions.restore();
        });

        it('should return forced variation before doing experiment status or audience checks', function() {
          var getVariation = optlyInstance.getVariation('testExperiment', 'user1');
          assert.strictEqual(getVariation, 'control');

          sinon.assert.calledOnce(Optimizely.prototype.__validateInputs);
          sinon.assert.notCalled(Optimizely.prototype.__validatePreconditions);
        });
      });
    });

    describe('__getBucketedVariationIdsForUser', function() {
      it('should return variation IDs for valid experiment IDs array', function() {
        bucketStub.returns('122229');
        assert.deepEqual(optlyInstance.__getBucketedVariationIdsForUser(['testExperiment'], 'testUser'), ['122229']);
        sinon.assert.notCalled(createdLogger.log);
      });
    });

    describe('__validateInputs', function() {
      it('should return true if user ID and attributes are valid', function() {
        assert.isTrue(optlyInstance.__validateInputs('testUser'));
        assert.isTrue(optlyInstance.__validateInputs('testUser', {browser_type: 'firefox'}));
        sinon.assert.notCalled(createdLogger.log);
      });

      it('should return false and throw an error if user ID is invalid', function() {
        var falseUserIdInput = optlyInstance.__validateInputs([]);
        assert.isFalse(falseUserIdInput);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));
      });

      it('should return false and throw an error if attributes are invalid', function() {
        var falseUserIdInput = optlyInstance.__validateInputs('testUser', []);
        assert.isFalse(falseUserIdInput);

        sinon.assert.calledOnce(errorHandler.handleError);
        var errorMessage = errorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));
      });
    });

    describe('__returnForcedVariationIdIfProvided', function() {
      it('should return forced variation ID if forced variation is provided for the user ID', function() {
        assert.strictEqual(optlyInstance.__returnForcedVariationIdIfProvided('testExperiment', 'user1'), '111128');
      });

      it('should return null if forced variation is not provided for the user ID', function() {
        assert.isNull(optlyInstance.__returnForcedVariationIdIfProvided('testExperiment', 'notInForcedVariations'));
      });
    });

    describe('__validatePreconditions', function() {
      it('should return true when experiment is running and audience conditions are met', function() {
        assert.isTrue(optlyInstance.__validatePreconditions('testExperiment', 'testUser'));
        assert.isTrue(optlyInstance.__validatePreconditions('testExperimentWithAudiences', 'testUser', {browser_type: 'firefox'}));
        sinon.assert.notCalled(createdLogger.log);
      });

      it('should return false when experiment is not running', function() {
        assert.isFalse(optlyInstance.__validatePreconditions('testExperimentNotRunning', 'testUser'));
        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'OPTIMIZELY', 'testExperimentNotRunning'));
      });

      it('should return false when audience conditions are not met', function() {
        assert.isFalse(optlyInstance.__validatePreconditions('testExperimentWithAudiences', 'testUser', {browser_type: 'chrome'}));
        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));
      });
    });

    describe('__buildBucketerParams', function() {
      it('should return params object with correct properties', function() {
        var bucketerParams = optlyInstance.__buildBucketerParams('testExperiment', 'testUser');

        var expectedParams = {
          experimentKey: optlyInstance.configObj.experiments[0].key,
          userId: 'testUser',
          experimentId: optlyInstance.configObj.experiments[0].id,
          trafficAllocationConfig: optlyInstance.configObj.experiments[0].trafficAllocation,
          experimentVariationKeyMap: optlyInstance.configObj.experimentVariationKeyMap,
          variationIdMap: optlyInstance.configObj.variationIdMap,
          logger: optlyInstance.logger,
          experimentKeyMap: optlyInstance.configObj.experimentKeyMap,
          groupIdMap: optlyInstance.configObj.groupIdMap,
        };

        assert.deepEqual(bucketerParams, expectedParams);

        sinon.assert.notCalled(createdLogger.log);
      });
    });
  });
});
