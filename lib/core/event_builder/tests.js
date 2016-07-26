var eventBuilder = require('./');
var packageJSON = require('../../../package.json');
var projectConfig = require('../project_config');
var testData = require('../../../tests/test_data').getTestProjectConfig();

var chai = require('chai');
var assert = chai.assert;
var _ = require('lodash');
var sinon = require('sinon');
var sprintf = require('sprintf');

describe('lib/core/event_builder', function() {
  describe('APIs', function() {

    var configObj;
    var clock;
    var expectedImpressionParams;
    var expectedConversionParams;

    beforeEach(function() {
      configObj = projectConfig.createProjectConfig(testData);
      clock = sinon.useFakeTimers(new Date().getTime());
    });

    afterEach(function() {
      clock.restore();
    });

    describe('getUrl', function() {
      it('should return URL for event API in getUrl', function() {
        var url = eventBuilder.getUrl(configObj);
        assert.strictEqual('https://111001.log.optimizely.com/event', url);
      });
    });

    describe('createImpressionEventParams', function() {
      it('should create proper params for createImpressionEventParams', function() {
        expectedImpressionParams = {
          d: '12001',
          a: '111001',
          n: 'visitor-event',
          'x111127': '111128',
          g: '111127',
          u: 'testUser',
          src: sprintf('node-sdk-%s', packageJSON.version),
          time: Math.round(new Date().getTime() / 1000.0)
        };

        // without attributes
        var expected1 = _.cloneDeep(expectedImpressionParams);

        // with attributes
        var expected2 = _.cloneDeep(expectedImpressionParams);
        expected2.s5175100584230912 = 'firefox';

        // with false as attribute value
        var expected3 = _.cloneDeep(expectedImpressionParams);
        expected3.s5175100584230912 = false;

        // with 0 as attribute value
        var expected4 = _.cloneDeep(expectedImpressionParams);
        expected4.s5175100584230912 = 0;

        var params1 = eventBuilder.createImpressionEventParams(configObj,
                                                               'testExperiment',
                                                               '111128',
                                                               'testUser');

        var params2 = eventBuilder.createImpressionEventParams(configObj,
                                                               'testExperiment',
                                                               '111128',
                                                               'testUser',
                                                               {browser_type: 'firefox'});

        var params3 = eventBuilder.createImpressionEventParams(configObj,
                                                               'testExperiment',
                                                               '111128',
                                                               'testUser',
                                                               {browser_type: false});

        var params4 = eventBuilder.createImpressionEventParams(configObj,
                                                               'testExperiment',
                                                               '111128',
                                                               'testUser',
                                                               {browser_type: 0});

        assert.deepEqual(expected1, params1);
        assert.deepEqual(expected2, params2);
        assert.deepEqual(expected3, params3);
        assert.deepEqual(expected4, params4);
      });
    });

    describe('createConversionEventParams', function() {
      it('should create proper params for createConversionEventParas', function() {
        expectedConversionParams = {
          d: '12001',
          a: '111001',
          n: 'testEvent',
          'x111127': '111128',
          g: '111095',
          u: 'testUser',
          src: sprintf('node-sdk-%s', packageJSON.version),
          time: Math.round(new Date().getTime() / 1000.0)
        };

        // without attributes or event value
        var expected1 = _.cloneDeep(expectedConversionParams);

        // with attributes
        var expected2 = _.cloneDeep(expectedConversionParams);
        expected2.s5175100584230912 = 'firefox';

        // with event value
        var expected3 = _.cloneDeep(expectedConversionParams);
        expected3.v = 4200;
        expected3.g = '111095,111096';

        // with false as attribute value
        var expected4 = _.cloneDeep(expectedConversionParams);
        expected4.s5175100584230912 = false;

        // with 0 as attribute value
        var expected5 = _.cloneDeep(expectedConversionParams);
        expected5.s5175100584230912 = 0;

        var conversionEventParams1 = eventBuilder.createConversionEventParams(configObj,
                                                                              'testEvent',
                                                                              'testUser',
                                                                              undefined,
                                                                              undefined,
                                                                              ['111128'],
                                                                              ['111127']);
        var conversionEventParams2 = eventBuilder.createConversionEventParams(configObj,
                                                                              'testEvent',
                                                                              'testUser',
                                                                              {browser_type: 'firefox'},
                                                                              undefined,
                                                                              ['111128'],
                                                                              ['111127']);
        var conversionEventParams3 = eventBuilder.createConversionEventParams(configObj,
                                                                              'testEvent',
                                                                              'testUser',
                                                                              undefined,
                                                                              4200,
                                                                              ['111128'],
                                                                              ['111127']);
        var conversionEventParams4 = eventBuilder.createConversionEventParams(configObj,
                                                                              'testEvent',
                                                                              'testUser',
                                                                              {browser_type: false},
                                                                              undefined,
                                                                              ['111128'],
                                                                              ['111127']);
        var conversionEventParams5 = eventBuilder.createConversionEventParams(configObj,
                                                                              'testEvent',
                                                                              'testUser',
                                                                              {browser_type: 0},
                                                                              undefined,
                                                                              ['111128'],
                                                                              ['111127']);

        assert.deepEqual(expected1, conversionEventParams1);
        assert.deepEqual(expected2, conversionEventParams2);
        assert.deepEqual(expected3, conversionEventParams3);
        assert.deepEqual(expected4, conversionEventParams4);
        assert.deepEqual(expected5, conversionEventParams5);
      });
    });
  });
});
