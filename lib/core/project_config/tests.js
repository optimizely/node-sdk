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
var projectConfig = require('./');
var enums = require('../../utils/enums');
var testDatafile = require('../../../tests/test_data');

var _ = require('lodash/core');
var chai = require('chai');
var assert = chai.assert;
var sprintf = require('sprintf');

var ERROR_MESSAGES = enums.ERROR_MESSAGES;

describe('lib/core/project_config', function() {
  var parsedAudiences = testDatafile.getParsedAudiences;
  describe('createProjectConfig method', function() {
    it('should set properties correctly when createProjectConfig is called', function() {
      var testData = testDatafile.getTestProjectConfig();
      var configObj = projectConfig.createProjectConfig(testData);

      _.forEach(testData.audiences, function(audience) {
        audience.conditions = JSON.parse(audience.conditions);
      });

      assert.strictEqual(configObj.accountId, testData.accountId);
      assert.strictEqual(configObj.projectId, testData.projectId);
      assert.strictEqual(configObj.revision, testData.revision);
      assert.deepEqual(configObj.events, testData.events);
      assert.deepEqual(configObj.audiences, testData.audiences);
      assert.deepEqual(configObj.groups, testData.groups);

      var expectedGroupIdMap = {
        666: testData.groups[0],
        667: testData.groups[1],
      };

      assert.deepEqual(configObj.groupIdMap, expectedGroupIdMap);

      var expectedExperiments = testData.experiments;
      _.forEach(configObj.groupIdMap, function(group, Id) {
        _.forEach(group.experiments, function(experiment) {
          expectedExperiments.push(_.assignIn(experiment, {groupId: Id}));
        });
      });
      assert.deepEqual(configObj.experiments, expectedExperiments);

      var expectedAttributeKeyMap = {
        browser_type: testData.attributes[0],
      };

      assert.deepEqual(configObj.attributeKeyMap, expectedAttributeKeyMap);

      var expectedExperimentKeyMap = {
        testExperiment: configObj.experiments[0],
        testExperimentWithAudiences: configObj.experiments[1],
        testExperimentNotRunning: configObj.experiments[2],
        testExperimentLaunched: configObj.experiments[3],
        groupExperiment1: configObj.experiments[4],
        groupExperiment2: configObj.experiments[5],
        overlappingGroupExperiment1: configObj.experiments[6],
      };

      assert.deepEqual(configObj.experimentKeyMap, expectedExperimentKeyMap);

      var expectedEventKeyMap = {
        testEvent: testData.events[0],
        'Total Revenue': testData.events[1],
        testEventWithAudiences: testData.events[2],
        testEventWithoutExperiments: testData.events[3],
        testEventWithExperimentNotRunning: testData.events[4],
        testEventWithMultipleExperiments: testData.events[5],
        testEventLaunched: testData.events[6],
      };

      assert.deepEqual(configObj.eventKeyMap, expectedEventKeyMap);

      var expectedExperimentIdMap = {
        '111127': configObj.experiments[0],
        '122227': configObj.experiments[1],
        '133337': configObj.experiments[2],
        '144447': configObj.experiments[3],
        '442': configObj.experiments[4],
        '443': configObj.experiments[5],
        '444': configObj.experiments[6],
      };

      assert.deepEqual(configObj.experimentIdMap, expectedExperimentIdMap);

      var expectedVariationKeyMap = {};
      expectedVariationKeyMap[testData.experiments[0].key + testData.experiments[0].variations[0].key] = testData.experiments[0].variations[0];
      expectedVariationKeyMap[testData.experiments[0].key + testData.experiments[0].variations[1].key] = testData.experiments[0].variations[1];
      expectedVariationKeyMap[testData.experiments[1].key + testData.experiments[1].variations[0].key] = testData.experiments[1].variations[0];
      expectedVariationKeyMap[testData.experiments[1].key + testData.experiments[1].variations[1].key] = testData.experiments[1].variations[1];
      expectedVariationKeyMap[testData.experiments[2].key + testData.experiments[2].variations[0].key] = testData.experiments[2].variations[0];
      expectedVariationKeyMap[testData.experiments[2].key + testData.experiments[2].variations[1].key] = testData.experiments[2].variations[1];
      expectedVariationKeyMap[configObj.experiments[3].key + configObj.experiments[3].variations[0].key] = configObj.experiments[3].variations[0];
      expectedVariationKeyMap[configObj.experiments[3].key + configObj.experiments[3].variations[1].key] = configObj.experiments[3].variations[1];
      expectedVariationKeyMap[configObj.experiments[4].key + configObj.experiments[4].variations[0].key] = configObj.experiments[4].variations[0];
      expectedVariationKeyMap[configObj.experiments[4].key + configObj.experiments[4].variations[1].key] = configObj.experiments[4].variations[1];
      expectedVariationKeyMap[configObj.experiments[5].key + configObj.experiments[5].variations[0].key] = configObj.experiments[5].variations[0];
      expectedVariationKeyMap[configObj.experiments[5].key + configObj.experiments[5].variations[1].key] = configObj.experiments[5].variations[1];
      expectedVariationKeyMap[configObj.experiments[6].key + configObj.experiments[6].variations[0].key] = configObj.experiments[6].variations[0];
      expectedVariationKeyMap[configObj.experiments[6].key + configObj.experiments[6].variations[1].key] = configObj.experiments[6].variations[1];

      assert.deepEqual(configObj.experimentVariationKeyMap, expectedVariationKeyMap);

      var expectedVariationIdMap = {
        '111128': testData.experiments[0].variations[0],
        '111129': testData.experiments[0].variations[1],
        '122228': testData.experiments[1].variations[0],
        '122229': testData.experiments[1].variations[1],
        '133338': testData.experiments[2].variations[0],
        '133339': testData.experiments[2].variations[1],
        '144448': testData.experiments[3].variations[0],
        '144449': testData.experiments[3].variations[1],
        '551': configObj.experiments[4].variations[0],
        '552': configObj.experiments[4].variations[1],
        '661': configObj.experiments[5].variations[0],
        '662': configObj.experiments[5].variations[1],
        '553': configObj.experiments[6].variations[0],
        '554': configObj.experiments[6].variations[1],
      };

      assert.deepEqual(configObj.variationIdMap, expectedVariationIdMap);
    });
  });

  describe('projectConfig helper methods', function() {
    var testData = testDatafile.getTestProjectConfig();
    var configObj;

    beforeEach(function() {
      configObj = projectConfig.createProjectConfig(testData);
    });

    it('should retrieve experiment ID for valid experiment key in getExperimentId', function() {
      assert.strictEqual(projectConfig.getExperimentId(configObj, testData.experiments[0].key),
                         testData.experiments[0].id);
    });

    it('should throw error for invalid experiment key in getExperimentId', function() {
      assert.throws(function() {
        projectConfig.getExperimentId(configObj, 'invalidExperimentKey');
      }, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));
    });

    it('should retrieve layer ID for valid experiment key in getLayerId', function() {
      assert.strictEqual(projectConfig.getLayerId(configObj, 'testExperiment'), '4');
    });

    it('should throw error for invalid experiment key in getLayerId', function() {
      assert.throws(function() {
        projectConfig.getLayerId(configObj, 'invalidExperimentKey');
      }, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));
    });

    it('should retrieve attribute ID for valid attribute key in getAttributeId', function() {
      assert.strictEqual(projectConfig.getAttributeId(configObj, 'browser_type'), '111094');
    });

    it('should return null for invalid attribute key in getAttributeId', function() {
      assert.isNull(projectConfig.getAttributeId(configObj, 'invalidAttributeKey'));
    });

    it('should retrieve event ID for valid event key in getEventId', function() {
      assert.strictEqual(projectConfig.getEventId(configObj, 'testEvent'), '111095');
    });

    it('should return null for invalid event key in getEventId', function() {
      assert.isNull(projectConfig.getEventId(configObj, 'invalidEventKey'));
    });

    it('should retrieve experiment status for valid experiment key in getExperimentStatus', function() {
      assert.strictEqual(projectConfig.getExperimentStatus(configObj, testData.experiments[0].key),
                         testData.experiments[0].status);
    });

    it('should throw error for invalid experiment key in getExperimentStatus', function() {
      assert.throws(function() {
        projectConfig.getExperimentStatus(configObj, 'invalidExperimentKey');
      }, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));
    });

    it('should retrieve audiences for valid experiment key in getAudiencesForExperiment', function() {
      assert.deepEqual(projectConfig.getAudiencesForExperiment(configObj, testData.experiments[1].key),
                       parsedAudiences);
    });

    it('should throw error for invalid experiment key in getAudiencesForExperiment', function() {
      assert.throws(function() {
        projectConfig.getAudiencesForExperiment(configObj, 'invalidExperimentKey');
      }, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));
    });

    it('should return true if experiment status is set to Running or Launch in isActive', function() {
      assert.isTrue(projectConfig.isActive(configObj, 'testExperiment'));

      assert.isTrue(projectConfig.isActive(configObj, 'testExperimentLaunched'));
    });

    it('should return true if experiment status is set to Running or Launch in isActive', function() {
      assert.isFalse(projectConfig.isActive(configObj, 'testExperimentNotRunning'));
    });

    it('should return true if experiment status is set to Running in isRunning', function() {
      assert.isTrue(projectConfig.isRunning(configObj, 'testExperiment'));
    });

    it('should return false if experiment status is not set to Running in isRunning', function() {
      assert.isFalse(projectConfig.isRunning(configObj, 'testExperimentLaunched'));
    });

    it('should retrieve variation key for valid experiment key and variation ID in getVariationKeyFromId', function() {
      assert.deepEqual(projectConfig.getVariationKeyFromId(configObj,
                                                           testData.experiments[0].variations[0].id),
                       testData.experiments[0].variations[0].key);
    });

    it('should retrieve revenue goal ID in getRevenueGoalId', function() {
      assert.strictEqual(projectConfig.getRevenueGoalId(configObj), testData.events[1].id);
    });

    it('should retrieve experiment IDs for event given valid event key in getExperimentIdsForEvent', function() {
      assert.deepEqual(projectConfig.getExperimentIdsForEvent(configObj, testData.events[0].key),
                       testData.events[0].experimentIds);
    });

    it('should throw error for invalid event key in getExperimentIdsForEvent', function() {
      assert.throws(function() {
        projectConfig.getExperimentIdsForEvent(configObj, 'invalidEventKey');
      }, sprintf(ERROR_MESSAGES.INVALID_EVENT_KEY, 'PROJECT_CONFIG', 'invalidEventKey'));
    });

    it('should retrieve traffic allocation given valid experiment key in getTrafficAllocation', function() {
      assert.deepEqual(projectConfig.getTrafficAllocation(configObj, testData.experiments[0].key),
                       testData.experiments[0].trafficAllocation);
    });

    it('should throw error for invalid experient key in getTrafficAllocation', function() {
      assert.throws(function() {
        projectConfig.getTrafficAllocation(configObj, 'invalidExperimentKey');
      }, sprintf(ERROR_MESSAGES.INVALID_EXPERIMENT_KEY, 'PROJECT_CONFIG', 'invalidExperimentKey'));
    });

    describe('#getVariationIdFromExperimentAndVariationKey', function() {
      it('should return the variation id for the given experiment key and variation key', function() {
        assert.strictEqual(
          projectConfig.getVariationIdFromExperimentAndVariationKey(
            configObj,
            testData.experiments[0].key,
            testData.experiments[0].variations[0].key
          ),
          testData.experiments[0].variations[0].id
        );
      });
    });
  });
});
