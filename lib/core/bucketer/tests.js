var bucketer = require('./');
var enums = require('../../utils/enums');
var logger = require('../../plugins/logger');
var projectConfig = require('../project_config');
var sprintf = require('sprintf');
var testData = require('../../../tests/test_data').getTestProjectConfig();

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var cloneDeep = require('lodash/cloneDeep');
var sinon = require('sinon');

var ERROR_MESSAGES = enums.ERROR_MESSAGES;
var LOG_LEVEL = enums.LOG_LEVEL;
var LOG_MESSAGES = enums.LOG_MESSAGES;

describe('lib/core/bucketer', function() {
  describe('APIs', function() {
    describe('bucket', function() {
      var configObj;
      var createdLogger = logger.createLogger({logLevel: LOG_LEVEL.INFO});
      var bucketerParams;

      beforeEach(function() {
        configObj = projectConfig.createProjectConfig(testData);
        bucketerParams = {
          experimentId: configObj.experiments[0].id,
          experimentKey: configObj.experiments[0].key,
          trafficAllocationConfig: configObj.experiments[0].trafficAllocation,
          forcedVariations: configObj.experimentKeyMap[configObj.experiments[0].key].forcedVariations,
          experimentVariationKeyMap: configObj.experimentVariationKeyMap,
          variationIdMap: configObj.variationIdMap,
          experimentKeyMap: configObj.experimentKeyMap,
          groupIdMap: configObj.groupIdMap,
          logger: createdLogger,
        };
        sinon.stub(createdLogger, 'log');
      });

      afterEach(function() {
        createdLogger.log.restore();
      });

      describe('return values for bucketing (excluding groups)', function() {
        beforeEach(function() {
          sinon.stub(bucketer, '_generateBucketValue')
            .onFirstCall().returns(50)
            .onSecondCall().returns(50000);
        });

        afterEach(function() {
          bucketer._generateBucketValue.restore();
        });

        it('should return correct variation ID when provided bucket value', function() {
          var bucketerParamsTest1 = cloneDeep(bucketerParams);
          bucketerParamsTest1.userId = 'ppid1';
          expect(bucketer.bucket(bucketerParamsTest1)).to.equal('111128');

          var bucketedUser_log1 = createdLogger.log.args[0][1];
          var bucketedUser_log2 = createdLogger.log.args[1][1];

          expect(bucketedUser_log1).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_VARIATION_BUCKET, 'BUCKETER', '50', 'ppid1'));
          expect(bucketedUser_log2).to.equal(sprintf(LOG_MESSAGES.USER_HAS_VARIATION, 'BUCKETER', 'ppid1', 'control', 'testExperiment'));

          var bucketerParamsTest2 = cloneDeep(bucketerParams);
          bucketerParamsTest2.userId = 'ppid2';
          expect(bucketer.bucket(bucketerParamsTest2)).to.equal(null);

          var notBucketedUser_log1 = createdLogger.log.args[2][1];
          var notBucketedUser_log2 = createdLogger.log.args[3][1];

          expect(notBucketedUser_log1).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_VARIATION_BUCKET, 'BUCKETER', '50000', 'ppid2'));
          expect(notBucketedUser_log2).to.equal(sprintf(LOG_MESSAGES.USER_HAS_NO_VARIATION, 'BUCKETER', 'ppid2', 'testExperiment'));
        });

        it('should return forced variation if user ID is in forcedVariations and variation is valid', function() {
          var bucketerParamsWithForcedVariations1 = cloneDeep(bucketerParams);
          bucketerParamsWithForcedVariations1.userId = 'user1';
          expect(bucketer.bucket(bucketerParamsWithForcedVariations1)).to.equal('111128');

          var bucketedUser1_log = createdLogger.log.args[0][1];
          expect(bucketedUser1_log).to.equal(sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, 'BUCKETER', 'user1', 'control'));

          var bucketerParamsWithForcedVariations2 = cloneDeep(bucketerParams);
          bucketerParamsWithForcedVariations2.userId = 'user2';
          expect(bucketer.bucket(bucketerParamsWithForcedVariations2)).to.equal('111129');

          var bucketedUser2_log = createdLogger.log.args[1][1];
          expect(bucketedUser2_log).to.equal(sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, 'BUCKETER', 'user2', 'variation'));
        });

        it('should return null if forced variation ID is not in the datafile', function() {
          var bucketerParamsWithInvalidForcedVariationIds = cloneDeep(bucketerParams);
          bucketerParamsWithInvalidForcedVariationIds.userId = 'user1';
          bucketerParamsWithInvalidForcedVariationIds.forcedVariations.user1 = 'variationNotInDatafile';

          expect(bucketer.bucket(bucketerParamsWithInvalidForcedVariationIds)).to.equal(null);

          var logMessage = createdLogger.log.args[0][1];
          expect(logMessage).to.equal(sprintf(LOG_MESSAGES.FORCED_BUCKETING_FAILED, 'BUCKETER', 'variationNotInDatafile', 'user1'));
        });
      });

      describe('return values for bucketing (including groups)', function() {
        var bucketerStub;
        beforeEach(function() {
          bucketerStub = sinon.stub(bucketer, '_generateBucketValue');
        });

        afterEach(function() {
          bucketer._generateBucketValue.restore();
        });

        describe('random groups', function() {
          bucketerParams = {};
          beforeEach(function() {
            bucketerParams = {
              experimentId: configObj.experiments[3].id,
              experimentKey: configObj.experiments[3].key,
              trafficAllocationConfig: configObj.experiments[3].trafficAllocation,
              forcedVariations: configObj.experimentKeyMap[configObj.experiments[0].key].forcedVariations,
              experimentVariationKeyMap: configObj.experimentVariationKeyMap,
              variationIdMap: configObj.variationIdMap,
              experimentKeyMap: configObj.experimentKeyMap,
              groupIdMap: configObj.groupIdMap,
              logger: createdLogger,
              userId: 'testUser',
            };
          });

          it('should return the proper variation for a user in a grouped experiment', function() {
            bucketerStub.onFirstCall().returns(50);
            bucketerStub.onSecondCall().returns(50);

            expect(bucketer.bucket(bucketerParams)).to.equal('551');

            sinon.assert.calledTwice(bucketerStub);
            sinon.assert.callCount(createdLogger.log, 4);

            var log1 = createdLogger.log.args[0][1];
            expect(log1).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_EXPERIMENT_BUCKET, 'BUCKETER', '50', 'testUser'));

            var log2 = createdLogger.log.args[1][1];
            expect(log2).to.equal(sprintf(LOG_MESSAGES.USER_BUCKETED_INTO_EXPERIMENT_IN_GROUP, 'BUCKETER', 'testUser', 'groupExperiment1', '666'));

            var log3 = createdLogger.log.args[2][1];
            expect(log3).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_VARIATION_BUCKET, 'BUCKETER', '50', 'testUser'));

            var log4 = createdLogger.log.args[3][1];
            expect(log4).to.equal(sprintf(LOG_MESSAGES.USER_HAS_VARIATION, 'BUCKETER', 'testUser', 'var1exp1', 'groupExperiment1'));
          });

          it('should return null when a user is bucketed into a different grouped experiment than the one speicfied', function() {
            bucketerStub.returns(5000);

            expect(bucketer.bucket(bucketerParams)).to.equal(null);

            sinon.assert.calledOnce(bucketerStub);
            sinon.assert.calledTwice(createdLogger.log);

            var log1 = createdLogger.log.args[0][1];
            expect(log1).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_EXPERIMENT_BUCKET, 'BUCKETER', '5000', 'testUser'));
            var log2 = createdLogger.log.args[1][1];
            expect(log2).to.equal(sprintf(LOG_MESSAGES.USER_NOT_BUCKETED_INTO_EXPERIMENT_IN_GROUP, 'BUCKETER', 'testUser', 'groupExperiment1', '666'));
          });

          it('should return null when a user is not bucketed into any experiments in the random group', function() {
            bucketerStub.returns(50000);

            expect(bucketer.bucket(bucketerParams)).to.equal(null);

            sinon.assert.calledOnce(bucketerStub);
            sinon.assert.calledTwice(createdLogger.log);

            var log1 = createdLogger.log.args[0][1];
            expect(log1).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_EXPERIMENT_BUCKET, 'BUCKETER', '50000', 'testUser'));
            var log2 = createdLogger.log.args[1][1];
            expect(log2).to.equal(sprintf(LOG_MESSAGES.USER_NOT_IN_ANY_EXPERIMENT, 'BUCKETER', 'testUser', '666'));
          });

          it('should return null when a user is bucketed into traffic space of deleted experiment within a random group', function() {
            bucketerStub.returns(9000);

            expect(bucketer.bucket(bucketerParams)).to.equal(null);

            sinon.assert.calledOnce(bucketerStub);
            sinon.assert.calledTwice(createdLogger.log);

            var log1 = createdLogger.log.args[0][1];
            expect(log1).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_EXPERIMENT_BUCKET, 'BUCKETER', '9000', 'testUser'));
            var log2 = createdLogger.log.args[1][1];
            expect(log2).to.equal(sprintf(LOG_MESSAGES.USER_NOT_IN_ANY_EXPERIMENT, 'BUCKETER', 'testUser', '666'));
          });

          it('should respect forced variations with grouped experiments', function() {
            var bucketerParamsForcedVariations = cloneDeep(bucketerParams);
            bucketerParamsForcedVariations.forcedVariations = {testUser: 'var2exp1'};

            expect(bucketer.bucket(bucketerParamsForcedVariations)).to.equal('552');

            sinon.assert.notCalled(bucketerStub);
            sinon.assert.calledOnce(createdLogger.log);

            var log = createdLogger.log.args[0][1];
            expect(log).to.equal(sprintf(LOG_MESSAGES.USER_FORCED_IN_VARIATION, 'BUCKETER', 'testUser', 'var2exp1'));
          });

          it('should throw an error if group ID is not in the datafile', function() {
            var bucketerParamsWithInvalidGroupId = cloneDeep(bucketerParams);
            bucketerParamsWithInvalidGroupId.experimentKeyMap[configObj.experiments[3].key].groupId = '6969';

            assert.throws(function() {
              bucketer.bucket(bucketerParamsWithInvalidGroupId);
            }, sprintf(ERROR_MESSAGES.INVALID_GROUP_ID, 'BUCKETER', '6969'));
          });
        });

        describe('overlapping groups', function() {
          bucketerParams = {};
          beforeEach(function() {
            bucketerParams = {
              experimentId: configObj.experiments[5].id,
              experimentKey: configObj.experiments[5].key,
              trafficAllocationConfig: configObj.experiments[5].trafficAllocation,
              forcedVariations: configObj.experimentKeyMap[configObj.experiments[0].key].forcedVariations,
              experimentVariationKeyMap: configObj.experimentVariationKeyMap,
              variationIdMap: configObj.variationIdMap,
              experimentKeyMap: configObj.experimentKeyMap,
              groupIdMap: configObj.groupIdMap,
              logger: createdLogger,
              userId: 'testUser',
            };
          });

          it('should return a variation when a user falls into an experiment within an overlapping group', function() {
            bucketerStub.returns(0);

            expect(bucketer.bucket(bucketerParams)).to.equal('553');

            sinon.assert.calledOnce(bucketerStub);
            sinon.assert.calledTwice(createdLogger.log);

            var log1 = createdLogger.log.args[0][1];
            expect(log1).to.equal(sprintf(LOG_MESSAGES.USER_ASSIGNED_TO_VARIATION_BUCKET, 'BUCKETER', '0', 'testUser'));
            var log2 = createdLogger.log.args[1][1];
            expect(log2).to.equal(sprintf(LOG_MESSAGES.USER_HAS_VARIATION, 'BUCKETER', 'testUser', 'overlappingvar1', 'overlappingGroupExperiment1'));
          });

          it('should return null when a user does not fall into an experiment within an overlapping group', function() {
            bucketerStub.returns(3000);

            expect(bucketer.bucket(bucketerParams)).to.equal(null);
          });
        });
      });
    });

    describe('_generateBucketValue', function() {
      it('should return a bucket value for different inputs', function() {
        var experimentId = 1886780721;
        var bucketingId1 = sprintf('%s%s', 'ppid1', experimentId);
        var bucketingId2 = sprintf('%s%s', 'ppid2', experimentId);
        var bucketingId3 = sprintf('%s%s', 'ppid2', 1886780722);
        var bucketingId4 = sprintf('%s%s', 'ppid3', experimentId);

        expect(bucketer._generateBucketValue(bucketingId1)).to.equal(5254);
        expect(bucketer._generateBucketValue(bucketingId2)).to.equal(4299);
        expect(bucketer._generateBucketValue(bucketingId3)).to.equal(2434);
        expect(bucketer._generateBucketValue(bucketingId4)).to.equal(5439);
      });

      it('should return an error if it cannot generate the hash value', function() {
        assert.throws(function() {
          bucketer._generateBucketValue(null);
        }, sprintf(ERROR_MESSAGES.INVALID_BUCKETING_ID, 'BUCKETER', null, 'Cannot read property \'length\' of null'));
      });
    });
  });
});
