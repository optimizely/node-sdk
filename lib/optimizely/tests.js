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
var Optimizely = require('./');
var bluebird = require('bluebird');
var bucketer = require('../core/bucketer');
var enums = require('../utils/enums');
var eventDispatcher = require('../plugins/event_dispatcher');
var errorHandler = require('../plugins/error_handler');
var jsonSchemaValidator = require('../utils/json_schema_validator');
var logger = require('../plugins/logger');
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

    describe('constructor', function() {
      it('should construct an instance of the Optimizely class', function() {
        var optlyInstance = new Optimizely({
          clientEngine: 'node-sdk',
          datafile: testData.getTestProjectConfig(),
          errorHandler: stubErrorHandler,
          eventDispatcher: stubEventDispatcher,
          logger: createdLogger,
        });
        assert.instanceOf(optlyInstance, Optimizely);
      });

      it('should log if the client engine passed in is invalid', function() {
        new Optimizely({
          datafile: testData.getTestProjectConfig(),
          errorHandler: stubErrorHandler,
          eventDispatcher: stubEventDispatcher,
          logger: createdLogger,
        });

        sinon.assert.called(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.INVALID_CLIENT_ENGINE, 'OPTIMIZELY', 'undefined'));
      });

      it('should throw an error if a datafile is not passed into the constructor', function() {
        var optly = new Optimizely({
          clientEngine: 'node-sdk',
          errorHandler: stubErrorHandler,
          logger: createdLogger,
        });
        sinon.assert.calledOnce(stubErrorHandler.handleError);
        var errorMessage = stubErrorHandler.handleError.lastCall.args[0].message;
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, 'OPTIMIZELY'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.NO_DATAFILE_SPECIFIED, 'OPTIMIZELY'));

        assert.isFalse(optly.isValidInstance);
      });

      it('should throw an error if the datafile is not valid', function() {
        var invalidDatafile = testData.getTestProjectConfig();
        delete invalidDatafile['projectId'];

        new Optimizely({
          clientEngine: 'node-sdk',
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
            clientEngine: 'node-sdk',
            datafile: testData.getTestProjectConfig(),
            errorHandler: stubErrorHandler,
            eventDispatcher: stubEventDispatcher,
            logger: logger.createLogger(),
            skipJSONValidation: true,
          });

          sinon.assert.notCalled(jsonSchemaValidator.validate);
        });

        it('should not skip JSON schema validation if skipJSONValidation is passed into instance args with any value other than true', function() {
          new Optimizely({
            clientEngine: 'node-sdk',
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
  });

  describe('APIs', function() {
    var optlyInstance;
    var optlyInstance;
    var bucketStub;
    var clock;

    var createdLogger = logger.createLogger({logLevel: LOG_LEVEL.INFO});
    beforeEach(function() {
      optlyInstance = new Optimizely({
        clientEngine: 'node-sdk',
        datafile: testData.getTestProjectConfig(),
        errorHandler: errorHandler,
        eventDispatcher: eventDispatcher,
        logger: createdLogger,
        isValidInstance: true,
      });

      bucketStub = sinon.stub(bucketer, 'bucket');
      sinon.stub(eventDispatcher, 'dispatchEvent').returns(bluebird.resolve());
      sinon.stub(errorHandler, 'handleError');
      sinon.stub(createdLogger, 'log');

      clock = sinon.useFakeTimers(new Date().getTime());
    });

    afterEach(function() {
      bucketer.bucket.restore();
      eventDispatcher.dispatchEvent.restore();
      errorHandler.handleError.restore();
      createdLogger.log.restore();
      clock.restore();
    });

    describe('#activate', function() {
      it('should call bucketer and dispatchEvent with proper args and return variation key', function() {
        bucketStub.returns('111129');
        var activate = optlyInstance.activate('testExperiment', 'testUser');
        assert.strictEqual(activate, 'variation');

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            layerId: '4',
            decision: {
              isLayerHoldback: false,
              experimentId: '111127',
              variationId: '111129',
            },
          },
        };
        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args and return variation key if user is in audience', function() {
        bucketStub.returns('122229');
        var activate = optlyInstance.activate('testExperimentWithAudiences', 'testUser', {browser_type: 'firefox'});
        assert.strictEqual(activate, 'variationWithAudience');

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [
              {
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              }
            ],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            layerId: '5',
            decision: {
              isLayerHoldback: false,
              experimentId: '122227',
              variationId: '122229',
            },
          },
        };

        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args and return variation key if user is in grouped experiment', function() {
        bucketStub.returns('662');
        var activate = optlyInstance.activate('groupExperiment2', 'testUser');
        assert.strictEqual(activate, 'var2exp2');

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            layerId: '2',
            decision: {
              isLayerHoldback: false,
              experimentId: '443',
              variationId: '662',
            },
          },
        };

        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args and return variation key if user is in grouped experiment and is in audience', function() {
        bucketStub.returns('552');
        var activate = optlyInstance.activate('groupExperiment1', 'testUser', {browser_type: 'firefox'});
        assert.strictEqual(activate, 'var2exp1');

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [
              {
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              }
            ],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            layerId: '1',
            decision: {
              isLayerHoldback: false,
              experimentId: '442',
              variationId: '552',
            },
          },
        };

        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);
      });

      it('should not make a dispatch event call if variation ID is null', function() {
        bucketStub.returns(null);
        assert.isNull(optlyInstance.activate('testExperiment', 'testUser'));
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER,
                                               'OPTIMIZELY',
                                               'testUser',
                                               'testExperiment'));
      });

      it('should return null if user is not in audience and user is not in group', function() {
        assert.isNull(optlyInstance.activate('testExperimentWithAudiences', 'testUser', {browser_type: 'chrome'}));
        sinon.assert.callCount(createdLogger.log, 2);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));

        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'testExperimentWithAudiences'));
      });

      it('should return null if user is not in audience and user is in group', function() {
        assert.isNull(optlyInstance.activate('groupExperiment1', 'testUser', {browser_type: 'chrome'}));
        sinon.assert.callCount(createdLogger.log, 2);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.USER_NOT_IN_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'groupExperiment1'));

        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_ACTIVATING_USER, 'OPTIMIZELY', 'testUser', 'groupExperiment1'));
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
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));

        sinon.assert.calledTwice(createdLogger.log);
        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));
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
        bucketStub.returns('111129');
        var instance = new Optimizely({
          datafile: testData.getTestProjectConfig(),
          errorHandler: errorHandler,
          eventDispatcher: eventDispatcher,
          logger: logger.createLogger({logLevel: 1}),
          isValidInstance: true,
        });

        var variation = instance.activate('testExperiment', 'testUser');
        assert.strictEqual(variation, 'variation');
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
      });

      describe('whitelisting', function() {
        beforeEach(function() {
          sinon.spy(Optimizely.prototype, '__validateInputs');
          sinon.spy(Optimizely.prototype, '__checkIfExperimentIsActive');
          sinon.spy(Optimizely.prototype, '__checkIfUserIsInAudience');
        });

        afterEach(function() {
          Optimizely.prototype.__validateInputs.restore();
          Optimizely.prototype.__checkIfExperimentIsActive.restore();
          Optimizely.prototype.__checkIfUserIsInAudience.restore();
        });

        it('should return forced variation after experiment status check and before audience check', function() {
          var activate = optlyInstance.activate('testExperiment', 'user1');
          assert.strictEqual(activate, 'control');

          sinon.assert.calledOnce(Optimizely.prototype.__validateInputs);
          sinon.assert.calledOnce(Optimizely.prototype.__checkIfExperimentIsActive);
          sinon.assert.notCalled(Optimizely.prototype.__checkIfUserIsInAudience);

          sinon.assert.calledTwice(createdLogger.log);
          var logMessage1 = createdLogger.log.args[0][1];
          assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, 'BUCKETER', 'user1', 'control'));

          var expectedObj = {
            url: 'https://logx.optimizely.com/log/decision',
            httpVerb: 'POST',
            params: {
              accountId: '12001',
              projectId: '111001',
              revision: '42',
              visitorId: 'user1',
              timestamp: Math.round(new Date().getTime()),
              isGlobalHoldback: false,
              userFeatures: [],
              clientEngine: 'node-sdk',
              clientVersion: enums.NODE_CLIENT_VERSION,
              layerId: '4',
              decision: {
                isLayerHoldback: false,
                experimentId: '111127',
                variationId: '111128',
              },
            },
          };

          var logMessage2 = createdLogger.log.args[1][1];
          assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.DISPATCH_IMPRESSION_EVENT,
                                                  'OPTIMIZELY',
                                                  expectedObj.url,
                                                  JSON.stringify(expectedObj.params)));
        });
      });

      it('returns the variation key but does not dispatch the event if user is in experiment and experiment is set to Launched', function() {
        bucketStub.returns('144448');

        var bucketedVariation = optlyInstance.activate('testExperimentLaunched', 'testUser');
        assert.strictEqual(bucketedVariation, 'controlLaunched');

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
      });

      it('should not activate when optimizely object is not a valid instance', function() {
        var instance = new Optimizely({
          datafile: {},
          errorHandler: errorHandler,
          eventDispatcher: eventDispatcher,
          logger: createdLogger,
        });

        createdLogger.log.reset();

        instance.activate('testExperiment', 'testUser');

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.INVALID_OBJECT, 'OPTIMIZELY', 'activate'));

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
      });
    });

    describe('#track', function() {
      it('should call bucketer and dispatchEvent with proper args', function() {
        bucketStub.returns('111129');
        optlyInstance.track('testEvent', 'testUser');

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.called(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventFeatures: [],
            layerStates: [
              {
                layerId: '4',
                revision: '42',
                decision: {
                  isLayerHoldback: false,
                  experimentId: '111127',
                  variationId: '111129',
                },
                actionTriggered: true,
              },
            ],
            eventMetrics: [],
          },
        };
        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args when including attributes', function() {
        bucketStub.returns('122229');
        optlyInstance.track('testEventWithAudiences', 'testUser', {browser_type: 'firefox'});

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [
              {
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              },
            ],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            eventEntityId: '111097',
            eventName: 'testEventWithAudiences',
            eventFeatures: [],
            layerStates: [
              {
                layerId: '5',
                revision: '42',
                decision: {
                  isLayerHoldback: false,
                  experimentId: '122227',
                  variationId: '122229',
                },
                actionTriggered: true,
              },
            ],
            eventMetrics: [],
          }
        };
        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args when including event value', function() {
        bucketStub.returns('111129');
        optlyInstance.track('testEvent', 'testUser', undefined, 4200);

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledTwice(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventFeatures: [{
              "name": "revenue",
              "type": 'custom',
              "value": 4200,
              "shouldIndex": false,
            }],
            layerStates: [
              {
                layerId: '4',
                revision: '42',
                decision: {
                  isLayerHoldback: false,
                  experimentId: '111127',
                  variationId: '111129',
                },
                actionTriggered: true,
              },
            ],
            eventMetrics: [
              {
                name: 'revenue',
                value: 4200,
              },
            ],
          }
        };
        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.DEPRECATED_EVENT_VALUE,
                                               'OPTIMIZELY',
                                               'track'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args when including event tags', function() {
        bucketStub.returns('111129');
        optlyInstance.track('testEvent', 'testUser', undefined, {eventTag: 'chill'});

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventFeatures: [{
              "name": "eventTag",
              "type": 'custom',
              "value": 'chill',
              "shouldIndex": false,
            }],
            layerStates: [
              {
                layerId: '4',
                revision: '42',
                decision: {
                  isLayerHoldback: false,
                  experimentId: '111127',
                  variationId: '111129',
                },
                actionTriggered: true,
              },
            ],
            eventMetrics: [],
          }
        };
        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args when including event tags and revenue', function() {
        bucketStub.returns('111129');
        optlyInstance.track('testEvent', 'testUser', undefined, {revenue: 4200, eventTag: 'chill'});

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);

        var expectedObj = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventFeatures: [{
              "name": "revenue",
              "type": 'custom',
              "value": 4200,
              "shouldIndex": false,
            }, {
              "name": "eventTag",
              "type": 'custom',
              "value": 'chill',
              "shouldIndex": false,
            }],
            layerStates: [
              {
                layerId: '4',
                revision: '42',
                decision: {
                  isLayerHoldback: false,
                  experimentId: '111127',
                  variationId: '111129',
                },
                actionTriggered: true,
              },
            ],
            eventMetrics: [
              {
                name: 'revenue',
                value: 4200,
              },
            ],
          }
        };
        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                               'OPTIMIZELY',
                                               expectedObj.url,
                                               JSON.stringify(expectedObj.params)));
      });

      it('should call bucketer and dispatchEvent with proper args when including invalid event value', function() {
        bucketStub.returns('111129');
        optlyInstance.track('testEvent', 'testUser', undefined, '4200');

        sinon.assert.notCalled(bucketer.bucket);
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);
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
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS, 'OPTIMIZELY', 'testEventWithExperimentNotRunning'));
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
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS, 'OPTIMIZELY', 'testEventWithAudiences'));
      });

      it('should not track a user when the event has no associated experiments', function() {
        optlyInstance.track('testEventWithoutExperiments', 'testUser');
        sinon.assert.notCalled(bucketer.bucket);
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.EVENT_NOT_ASSOCIATED_WITH_EXPERIMENTS, 'OPTIMIZELY', 'testEventWithoutExperiments'));
      });

      it('should not track a user when the user is not bucketed into the experiment', function() {
        bucketStub.returns(null);
        optlyInstance.track('testEvent', 'testUser');
        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperiment'));
      });

      it('should only send conversion events in experiments the user is bucketed into', function() {
        bucketStub.onCall(0).returns('111129');
        bucketStub.onCall(1).returns(null);

        optlyInstance.track('testEventWithMultipleExperiments', 'testUser', {browser_type: 'firefox'});

        sinon.assert.calledTwice(bucketer.bucket);

        // conversion event only dispatched once because user is bucketed into only 1 of 3 experiments
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
      });

      it('should only track a user for experiments where they are in the audience and where the experiment is running', function() {
        var expectedObj = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            accountId: '12001',
            projectId: '111001',
            revision: '42',
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            isGlobalHoldback: false,
            userFeatures: [
              {
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              }
            ],
            clientEngine: 'node-sdk',
            clientVersion: enums.NODE_CLIENT_VERSION,
            eventEntityId: '111100',
            eventName: 'testEventWithMultipleExperiments',
            eventFeatures: [],
            layerStates: [
              {
                layerId: '4',
                revision: '42',
                decision: {
                  isLayerHoldback: false,
                  experimentId: '111127',
                  variationId: '111129',
                },
                actionTriggered: true,
              },
              {
                layerId: '5',
                revision: '42',
                decision: {
                  isLayerHoldback: false,
                  experimentId: '122227',
                  variationId: '122229',
                },
                actionTriggered: true,
              },
            ],
            eventMetrics: [],
          }
        };

        bucketStub.onCall(0).returns('111129');
        bucketStub.onCall(1).returns('122229');
        // Of the 3 experiments attached to the event, 2 are sent in conversion event (one without audiences and one with proper audience are in - one with experiment not running is left out)
        optlyInstance.track('testEventWithMultipleExperiments', 'testUser', {browser_type: 'firefox'});

        sinon.assert.calledTwice(bucketStub);
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);

        var eventDispatcherCall = eventDispatcher.dispatchEvent.args[0];
        assert.deepEqual(eventDispatcherCall[0], expectedObj);

        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'OPTIMIZELY', 'testExperimentNotRunning'));
        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_TRACKING_USER_FOR_EXPERIMENT, 'OPTIMIZELY', 'testUser', 'testExperimentNotRunning'));
        var logMessage3 = createdLogger.log.args[2][1];
        assert.strictEqual(logMessage3, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                                'OPTIMIZELY',
                                                expectedObj.url,
                                                JSON.stringify(expectedObj.params)));
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

        sinon.assert.calledTwice(createdLogger.log);
        var logMessage1 = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage1, sprintf(ERROR_MESSAGES.INVALID_EVENT_KEY, 'PROJECT_CONFIG', 'invalidEventKey'));

        var logMessage2 = createdLogger.log.args[1][1];
        assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.NOT_TRACKING_USER, 'OPTIMIZELY', 'testUser'));
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
        bucketStub.returns('111129');
        var instance = new Optimizely({
          datafile: testData.getTestProjectConfig(),
          errorHandler: errorHandler,
          eventDispatcher: eventDispatcher,
          logger: logger.createLogger({logLevel: 1}),
          isValidInstance: true,
        });

        instance.track('testEvent', 'testUser');
        sinon.assert.calledOnce(eventDispatcher.dispatchEvent);
      });

      describe('whitelisting', function() {
        beforeEach(function() {
          sinon.spy(Optimizely.prototype, '__validateInputs');
          sinon.spy(Optimizely.prototype, '__checkIfExperimentIsActive');
          sinon.spy(Optimizely.prototype, '__checkIfUserIsInAudience');
        });

        afterEach(function() {
          Optimizely.prototype.__validateInputs.restore();
          Optimizely.prototype.__checkIfExperimentIsActive.restore();
          Optimizely.prototype.__checkIfUserIsInAudience.restore();
        });

        it('should return forced variation after experiment status check and before audience check when looping through valid experiments', function() {
          optlyInstance.track('testEvent', 'user1');

          sinon.assert.calledTwice(Optimizely.prototype.__validateInputs);
          sinon.assert.calledOnce(Optimizely.prototype.__checkIfExperimentIsActive);
          sinon.assert.notCalled(Optimizely.prototype.__checkIfUserIsInAudience);

          sinon.assert.calledTwice(createdLogger.log);

          var logMessage1 = createdLogger.log.args[0][1];
          assert.strictEqual(logMessage1, sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, 'BUCKETER', 'user1', 'control'));

          var expectedObj = {
            url: 'https://logx.optimizely.com/log/event',
            httpVerb: 'POST',
            params: {
              accountId: '12001',
              projectId: '111001',
              revision: '42',
              visitorId: 'user1',
              timestamp: Math.round(new Date().getTime()),
              isGlobalHoldback: false,
              userFeatures: [],
              clientEngine: 'node-sdk',
              clientVersion: enums.NODE_CLIENT_VERSION,
              eventEntityId: '111095',
              eventName: 'testEvent',
              eventFeatures: [],
              layerStates: [
                {
                  layerId: '4',
                  revision: '42',
                  decision: {
                    isLayerHoldback: false,
                    experimentId: '111127',
                    variationId: '111128',
                  },
                  actionTriggered: true,
                },
              ],
              eventMetrics: [],
            },
          };

          var logMessage2 = createdLogger.log.args[1][1];
          assert.strictEqual(logMessage2, sprintf(LOG_MESSAGES.DISPATCH_CONVERSION_EVENT,
                                                  'OPTIMIZELY',
                                                  expectedObj.url,
                                                  JSON.stringify(expectedObj.params)));
        });
      });

      it('does not dispatch the event if user is in experiment and experiment is set to Launched', function() {
        bucketStub.returns('144448');

        optlyInstance.track('testEventLaunched', 'testUser');

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
      });

      it('should not track when optimizely object is not a valid instance', function() {
        var instance = new Optimizely({
          datafile: {},
          errorHandler: errorHandler,
          eventDispatcher: eventDispatcher,
          logger: createdLogger,
        });

        createdLogger.log.reset();

        instance.track('testExperiment', 'testUser');

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.INVALID_OBJECT, 'OPTIMIZELY', 'track'));

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
      });
    });

    describe('#getVariation', function() {
      it('should call bucketer and return variation key', function() {
        bucketStub.returns('111129');
        var getVariation = optlyInstance.getVariation('testExperiment', 'testUser');

        assert.strictEqual(getVariation, 'variation');

        sinon.assert.calledOnce(bucketer.bucket);
        sinon.assert.notCalled(createdLogger.log);
      });

      it('should call bucketer and return variation key with attributes', function() {
        bucketStub.returns('122229');
        var getVariation = optlyInstance.getVariation('testExperimentWithAudiences',
                                                         'testUser',
                                                         {browser_type: 'firefox'});

        assert.strictEqual(getVariation, 'variationWithAudience');

        sinon.assert.calledOnce(bucketer.bucket);
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
        assert.strictEqual(errorMessage, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));
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

      describe('whitelisting', function() {
        beforeEach(function() {
          sinon.spy(Optimizely.prototype, '__validateInputs');
          sinon.spy(Optimizely.prototype, '__checkIfExperimentIsActive');
          sinon.spy(Optimizely.prototype, '__checkIfUserIsInAudience');
        });

        afterEach(function() {
          Optimizely.prototype.__validateInputs.restore();
          Optimizely.prototype.__checkIfExperimentIsActive.restore();
          Optimizely.prototype.__checkIfUserIsInAudience.restore();
        });

        it('should return forced variation after experiment status check and before audience check', function() {
          var getVariation = optlyInstance.getVariation('testExperiment', 'user1');
          assert.strictEqual(getVariation, 'control');

          sinon.assert.calledOnce(Optimizely.prototype.__validateInputs);
          sinon.assert.calledOnce(Optimizely.prototype.__checkIfExperimentIsActive);
          sinon.assert.notCalled(Optimizely.prototype.__checkIfUserIsInAudience);

          sinon.assert.calledOnce(createdLogger.log);

          var logMessage = createdLogger.log.args[0][1];
          assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, 'BUCKETER', 'user1', 'control'));
        });
      });

      it('should not return variation when optimizely object is not a valid instance', function() {
        var instance = new Optimizely({
          datafile: {},
          errorHandler: errorHandler,
          eventDispatcher: eventDispatcher,
          logger: createdLogger,
        });

        createdLogger.log.reset();

        instance.getVariation('testExperiment', 'testUser');

        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.INVALID_OBJECT, 'OPTIMIZELY', 'getVariation'));

        sinon.assert.notCalled(eventDispatcher.dispatchEvent);
      });

      describe('order of bucketing operations', function() {
        it('should properly follow the order of bucketing operations', function() {
          // Order of operations is preconditions > experiment is running > whitelisting > audience eval > variation bucketing
          bucketStub.returns('122228'); // returns the control variation

          // invalid user, running experiment
          assert.isNull(optlyInstance.activate('testExperiment', 123));

          // valid user, experiment not running, whitelisted
          assert.isNull(optlyInstance.activate('testExperimentNotRunning', 'user1'));

          // valid user, experiment running, not whitelisted, does not meet audience conditions
          assert.isNull(optlyInstance.activate('testExperimentWithAudiences', 'user3'));

          // valid user, experiment running, not whitelisted, meets audience conditions
          assert.strictEqual(optlyInstance.activate('testExperimentWithAudiences', 'user3', { browser_type: 'firefox' }), 'controlWithAudience');

          // valid user, running experiment, whitelisted, does not meet audience conditions
          // expect user to be forced into `variationWithAudience` through whitelisting
          assert.strictEqual(optlyInstance.activate('testExperimentWithAudiences', 'user2', { browser_type: 'chrome' }), 'variationWithAudience');

          // valid user, running experiment, whitelisted, meets audience conditions
          // expect user to be forced into `variationWithAudience (122229)` through whitelisting
          assert.strictEqual(optlyInstance.activate('testExperimentWithAudiences', 'user2', { browser_type: 'firefox' }), 'variationWithAudience');
        });
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

    describe('__checkIfExperimentIsActive', function() {
      it('should return true if experiment is running', function() {
        assert.isTrue(optlyInstance.__checkIfExperimentIsActive('testExperiment', 'testUser'));
        sinon.assert.notCalled(createdLogger.log);
      });

      it('should return false when experiment is not running', function() {
        assert.isFalse(optlyInstance.__checkIfExperimentIsActive('testExperimentNotRunning', 'testUser'));
        sinon.assert.calledOnce(createdLogger.log);
        var logMessage = createdLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'OPTIMIZELY', 'testExperimentNotRunning'));
      });
    });

    describe('__returnForcedVariationIdIfProvided', function() {
      it('should return forced variation ID if forced variation is provided for the user ID', function() {
        assert.strictEqual(optlyInstance.__returnForcedVariationIdIfProvided('testExperiment', 'user1'), '111128');
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
      });
    });

    describe('__checkIfUserIsInAudience', function() {
      it('should return true when audience conditions are met', function() {
        assert.isTrue(optlyInstance.__checkIfUserIsInAudience('testExperimentWithAudiences', 'testUser', {browser_type: 'firefox'}));
        sinon.assert.notCalled(createdLogger.log);
      });

      it('should return true when experiment has no audience', function() {
        assert.isTrue(optlyInstance.__checkIfUserIsInAudience('testExperiment', 'testUser'));
        sinon.assert.notCalled(createdLogger.log);
      });

      it('should return false when audience conditions are not met', function() {
        assert.isFalse(optlyInstance.__checkIfUserIsInAudience('testExperimentWithAudiences', 'testUser', {browser_type: 'chrome'}));
        sinon.assert.calledOnce(createdLogger.log);
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

    describe('__buildBucketerParams', function() {
      it('should return params object with correct properties', function() {
        var bucketerParams = optlyInstance.__buildBucketerParams('testExperiment', 'testUser');

        var expectedParams = {
          experimentKey: 'testExperiment',
          userId: 'testUser',
          experimentId: '111127',
          trafficAllocationConfig: [
            {
              entityId: '111128',
              endOfRange: 4000,
            },
            {
              entityId: '111129',
              endOfRange: 9000,
            },
          ],
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
