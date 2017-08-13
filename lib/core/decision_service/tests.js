/****************************************************************************
 * Copyright 2017, Optimizely, Inc. and contributors                        *
 *                                                                          *
 * Licensed under the Apache License, Version 2.0 (the "License");          *
 * you may not use this file except in compliance with the License.         *
 * You may obtain a copy of the License at                                  *
 *                                                                          *
 *    http://www.apache.org/licenses/LICENSE-2.0                            *
 *                                                                          *
 * Unless required by applicable law or agreed to in writing, software      *
 * distributed under the License is distributed on an "AS IS" BASIS,        *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. *
 * See the License for the specific language governing permissions and      *
 * limitations under the License.                                           *
 ***************************************************************************/

var bucketer = require('../bucketer');
var DecisionService = require('./');
var enums = require('../../utils/enums');
var logger = require('../../plugins/logger');
var projectConfig = require('../project_config');
var sprintf = require('sprintf');
var testData = require('../../../tests/test_data').getTestProjectConfig();

var chai = require('chai');
var sinon = require('sinon');
var assert = chai.assert;

var LOG_LEVEL = enums.LOG_LEVEL;
var LOG_MESSAGES = enums.LOG_MESSAGES;

describe('lib/core/decision_service', function() {
  describe('APIs', function() {
    var configObj = projectConfig.createProjectConfig(testData);
    var decisionServiceInstance;
    var mockLogger = logger.createLogger({logLevel: LOG_LEVEL.INFO});
    var bucketerStub;

    beforeEach(function() {
      bucketerStub = sinon.stub(bucketer, 'bucket');
      sinon.stub(mockLogger, 'log');
      decisionServiceInstance = DecisionService.createDecisionService({
        configObj: configObj,
        logger: mockLogger,
      });
    });

    afterEach(function() {
      bucketer.bucket.restore();
      mockLogger.log.restore();
    });

    describe('#getVariation', function() {
      it('should return the correct variation for the given experiment key and user ID for a running experiment', function() {
        bucketerStub.returns('111128'); // ID of the 'control' variation from `test_data`
        assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
        sinon.assert.calledOnce(bucketerStub);
      });

      it('should return the whitelisted variation if the user is whitelisted', function() {
        assert.strictEqual('variationWithAudience', decisionServiceInstance.getVariation('testExperimentWithAudiences', 'user2'));
        sinon.assert.notCalled(bucketerStub);
        assert.strictEqual(2, mockLogger.log.callCount);
        assert.strictEqual(mockLogger.log.args[0][1], 'PROJECT_CONFIG: User user2 is not in the forced variation map.');
        assert.strictEqual(mockLogger.log.args[1][1], 'DECISION_SERVICE: User user2 is forced in variation variationWithAudience.');
      });

      it('should return null if the user does not meet audience conditions', function() {
        assert.isNull(decisionServiceInstance.getVariation('testExperimentWithAudiences', 'user3', { foo: 'bar' }));
        assert.strictEqual(2, mockLogger.log.callCount);
        assert.strictEqual(mockLogger.log.args[0][1], 'PROJECT_CONFIG: User user3 is not in the forced variation map.');
        assert.strictEqual(mockLogger.log.args[1][1], 'DECISION_SERVICE: User user3 does not meet conditions to be in experiment testExperimentWithAudiences.');
      });

      it('should return null if the experiment is not running', function() {
        assert.isNull(decisionServiceInstance.getVariation('testExperimentNotRunning', 'user1'));
        sinon.assert.notCalled(bucketerStub);
        assert.strictEqual(1, mockLogger.log.callCount);
        assert.strictEqual(mockLogger.log.args[0][1], 'DECISION_SERVICE: Experiment testExperimentNotRunning is not running.');
      });

      describe('when a user profile service is provided', function() {
        var userProfileServiceInstance = null;
        var userProfileLookupStub;
        var userProfileSaveStub;
        beforeEach(function() {
          userProfileServiceInstance = {
            lookup: function() {},
            save: function() {},
          };

          decisionServiceInstance = DecisionService.createDecisionService({
            configObj: configObj,
            logger: mockLogger,
            userProfileService: userProfileServiceInstance,
          });
          userProfileLookupStub = sinon.stub(userProfileServiceInstance, 'lookup');
          userProfileSaveStub = sinon.stub(userProfileServiceInstance, 'save');
          sinon.stub(decisionServiceInstance, '__getWhitelistedVariation').returns(null);
        });

        afterEach(function() {
          userProfileServiceInstance.lookup.restore();
          userProfileServiceInstance.save.restore();
          decisionServiceInstance.__getWhitelistedVariation.restore();
        });

        it('should return the previously bucketed variation', function() {
          userProfileLookupStub.returns({
            user_id: 'decision_service_user',
            experiment_bucket_map: {
              '111127': {
                'variation_id': '111128' // ID of the 'control' variation
              },
            },
          });

          assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
          sinon.assert.calledWith(userProfileLookupStub, 'decision_service_user');
          sinon.assert.notCalled(bucketerStub);
          assert.strictEqual(mockLogger.log.args[0][1], 'PROJECT_CONFIG: User decision_service_user is not in the forced variation map.');
          assert.strictEqual(mockLogger.log.args[1][1], 'DECISION_SERVICE: Returning previously activated variation \"control\" of experiment \"testExperiment\" for user \"decision_service_user\" from user profile.');
        });

        it('should bucket if there was no prevously bucketed variation', function() {
          bucketerStub.returns('111128'); // ID of the 'control' variation
          userProfileLookupStub.returns({
            user_id: 'decision_service_user',
            experiment_bucket_map: {},
          });

          assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
          sinon.assert.calledWith(userProfileLookupStub, 'decision_service_user');
          sinon.assert.calledOnce(bucketerStub);
          // make sure we save the decision
          sinon.assert.calledWith(userProfileSaveStub, {
            user_id: 'decision_service_user',
            experiment_bucket_map: {
              '111127': {
                'variation_id': '111128',
              }
            },
          });
        });

        it('should bucket if the user profile service returns null', function() {
          bucketerStub.returns('111128'); // ID of the 'control' variation
          userProfileLookupStub.returns(null);

          assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
          sinon.assert.calledWith(userProfileLookupStub, 'decision_service_user');
          sinon.assert.calledOnce(bucketerStub);
          // make sure we save the decision
          sinon.assert.calledWith(userProfileSaveStub, {
            user_id: 'decision_service_user',
            experiment_bucket_map: {
              '111127': {
                'variation_id': '111128',
              }
            },
          });
        });

        it('should re-bucket if the stored variation is no longer valid', function() {
          bucketerStub.returns('111128'); // ID of the 'control' variation
          userProfileLookupStub.returns({
            user_id: 'decision_service_user',
            experiment_bucket_map: {
              '111127': {
                'variation_id': 'not valid variation',
              },
            },
          });

          assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
          sinon.assert.calledWith(userProfileLookupStub, 'decision_service_user');
          sinon.assert.calledOnce(bucketerStub);
          assert.strictEqual(mockLogger.log.args[0][1], 'PROJECT_CONFIG: User decision_service_user is not in the forced variation map.');
          assert.strictEqual(mockLogger.log.args[1][1], 'DECISION_SERVICE: User decision_service_user was previously bucketed into variation with ID not valid variation for experiment testExperiment, but no matching variation was found.');
          // make sure we save the decision
          sinon.assert.calledWith(userProfileSaveStub, {
            user_id: 'decision_service_user',
            experiment_bucket_map: {
              '111127': {
                'variation_id': '111128',
              }
            },
          });
        });

        it('should store the bucketed variation for the user', function() {
          bucketerStub.returns('111128'); // ID of the 'control' variation
          userProfileLookupStub.returns({
            user_id: 'decision_service_user',
            experiment_bucket_map: {}, // no decisions for user
          });

          assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
          sinon.assert.calledWith(userProfileLookupStub, 'decision_service_user');
          sinon.assert.calledOnce(bucketerStub);
          sinon.assert.calledWith(userProfileServiceInstance.save, {
            user_id: 'decision_service_user',
            experiment_bucket_map: {
              '111127': {
                variation_id: '111128',
              },
            },
          });
          assert.strictEqual(mockLogger.log.args[0][1], 'PROJECT_CONFIG: User decision_service_user is not in the forced variation map.');
          assert.strictEqual(mockLogger.log.args[1][1], 'DECISION_SERVICE: Saved variation "control" of experiment "testExperiment" for user "decision_service_user".');
        });

        it('should log an error message if "lookup" throws an error', function() {
          bucketerStub.returns('111128'); // ID of the 'control' variation
          userProfileLookupStub.throws(new Error('I am an error'));

          assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
          sinon.assert.calledWith(userProfileLookupStub, 'decision_service_user');
          sinon.assert.calledOnce(bucketerStub); // should still go through with bucketing
          assert.strictEqual(mockLogger.log.args[0][1], 'PROJECT_CONFIG: User decision_service_user is not in the forced variation map.');
          assert.strictEqual(mockLogger.log.args[1][1], 'DECISION_SERVICE: Error while looking up user profile for user ID "decision_service_user": I am an error.');
        });

        it('should log an error message if "save" throws an error', function() {
          bucketerStub.returns('111128'); // ID of the 'control' variation
          userProfileLookupStub.returns(null);
          userProfileSaveStub.throws(new Error('I am an error'));

          assert.strictEqual('control', decisionServiceInstance.getVariation('testExperiment', 'decision_service_user'));
          sinon.assert.calledWith(userProfileLookupStub, 'decision_service_user');
          sinon.assert.calledOnce(bucketerStub); // should still go through with bucketing
          assert.strictEqual(mockLogger.log.args[0][1], 'PROJECT_CONFIG: User decision_service_user is not in the forced variation map.');
          assert.strictEqual(mockLogger.log.args[1][1], 'DECISION_SERVICE: Error while saving user profile for user ID "decision_service_user": I am an error.');

          // make sure that we save the decision
          sinon.assert.calledWith(userProfileSaveStub, {
            user_id: 'decision_service_user',
            experiment_bucket_map: {
              '111127': {
                'variation_id': '111128',
              }
            },
          });
        });
      });
    });

    describe('__buildBucketerParams', function() {
      it('should return params object with correct properties', function() {
        var bucketerParams = decisionServiceInstance.__buildBucketerParams('testExperiment', 'testUser');

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
          variationIdMap: configObj.variationIdMap,
          logger: mockLogger,
          experimentKeyMap: configObj.experimentKeyMap,
          groupIdMap: configObj.groupIdMap,
        };

        assert.deepEqual(bucketerParams, expectedParams);

        sinon.assert.notCalled(mockLogger.log);
      });
    });

    describe('__checkIfExperimentIsActive', function() {
      it('should return true if experiment is running', function() {
        assert.isTrue(decisionServiceInstance.__checkIfExperimentIsActive('testExperiment', 'testUser'));
        sinon.assert.notCalled(mockLogger.log);
      });

      it('should return false when experiment is not running', function() {
        assert.isFalse(decisionServiceInstance.__checkIfExperimentIsActive('testExperimentNotRunning', 'testUser'));
        sinon.assert.calledOnce(mockLogger.log);
        var logMessage = mockLogger.log.args[0][1];
        assert.strictEqual(logMessage, sprintf(LOG_MESSAGES.EXPERIMENT_NOT_RUNNING, 'DECISION_SERVICE', 'testExperimentNotRunning'));
      });
    });

    describe('__checkIfUserIsInAudience', function() {
      it('should return true when audience conditions are met', function() {
        assert.isTrue(decisionServiceInstance.__checkIfUserIsInAudience('testExperimentWithAudiences', 'testUser', {browser_type: 'firefox'}));
        sinon.assert.notCalled(mockLogger.log);
      });

      it('should return true when experiment has no audience', function() {
        assert.isTrue(decisionServiceInstance.__checkIfUserIsInAudience('testExperiment', 'testUser'));
        sinon.assert.notCalled(mockLogger.log);
      });

      it('should return false when audience conditions are not met', function() {
        assert.isFalse(decisionServiceInstance.__checkIfUserIsInAudience('testExperimentWithAudiences', 'testUser', {browser_type: 'chrome'}));
        sinon.assert.calledOnce(mockLogger.log);
      });
    });

    describe('__getWhitelistedVariation', function() {
      it('should return forced variation ID if forced variation is provided for the user ID', function() {
        var testExperiment = configObj.experimentKeyMap['testExperiment'];
        var expectedVariation = configObj.variationIdMap['111128'];
        assert.strictEqual(decisionServiceInstance.__getWhitelistedVariation(testExperiment, 'user1'), expectedVariation);
      });

      it('should return null if forced variation is not provided for the user ID', function() {
        var testExperiment = configObj.experimentKeyMap['testExperiment'];
        assert.isNull(decisionServiceInstance.__getWhitelistedVariation(testExperiment, 'notInForcedVariations'));
      });
    });
  });
});
