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
var eventBuilder = require('./');
var packageJSON = require('../../../package.json');
var projectConfig = require('../project_config');
var testData = require('../../../tests/test_data');

var chai = require('chai');
var assert = chai.assert;
var _ = require('lodash');
var sinon = require('sinon');
var sprintf = require('sprintf');

describe('lib/core/event_builder', function() {
  describe('APIs', function() {

    var testDataClassicOptly = testData.getTestProjectConfig();
    var testDataNewOptly = testData.getTestProjectConfigNewOptly();
    var configObj;
    var configObjNewOptly;
    var clock;
    var expectedImpressionParams;
    var expectedConversionParams;

    beforeEach(function() {
      configObj = projectConfig.createProjectConfig(testDataClassicOptly);
      configObjNewOptly = projectConfig.createProjectConfig(testDataNewOptly);
      clock = sinon.useFakeTimers(new Date().getTime());
    });

    afterEach(function() {
      clock.restore();
    });

    describe('getImpressionEvent', function() {
      it('should create proper params for getImpressionEvent in Classic Optimizely', function() {
        expectedImpressionParams = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            d: '12001',
            a: '111001',
            n: 'visitor-event',
            'x111127': '111128',
            g: '111127',
            u: 'testUser',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0)
          },
        };

        // without attributes
        var expected1 = _.cloneDeep(expectedImpressionParams);

        // with attributes
        var expected2 = _.cloneDeep(expectedImpressionParams);
        expected2.params.s5175100584230912 = 'firefox';

        // with false as attribute value
        var expected3 = _.cloneDeep(expectedImpressionParams);
        expected3.params.s5175100584230912 = false;

        // with 0 as attribute value
        var expected4 = _.cloneDeep(expectedImpressionParams);
        expected4.params.s5175100584230912 = 0;

        var eventOptions1 = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
        };
        var params1 = eventBuilder.getImpressionEvent(eventOptions1);

        var eventOptions2 = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
          attributes: {browser_type: 'firefox'},
        };
        var params2 = eventBuilder.getImpressionEvent(eventOptions2);

        var eventOptions3 = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
          attributes: {browser_type: false},
        };
        var params3 = eventBuilder.getImpressionEvent(eventOptions3);

        var eventOptions4 = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
          attributes: {browser_type: 0},
        };
        var params4 = eventBuilder.getImpressionEvent(eventOptions4);

        assert.deepEqual(expected1, params1);
        assert.deepEqual(expected2, params2);
        assert.deepEqual(expected3, params3);
        assert.deepEqual(expected4, params4);
      });

      it('should not fill in userFeatures for getConversion when attribute is not in datafile in Optimizely Classic', function() {
        expectedImpressionParams = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            d: '12001',
            a: '111001',
            n: 'visitor-event',
            'x111127': '111128',
            g: '111127',
            u: 'testUser',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0)
          },
        };

        var eventOptions = {
          attributes: {invalid_attribute: 'sorry_not_sorry'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
        };
        var params = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(params, expectedImpressionParams);
      });

      it('should create proper params for getImpressionEvent in New Optimizely without attributes', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            isGlobalHoldback: false,
            projectId: '111001',
            revision: '42',
            decision: {
              variationId: '111128',
              isLayerHoldback: false,
              experimentId: '111127',
            },
            layerId: '4',
            accountId: '12001',
            userFeatures: [],
          },
        };

        var eventOptions = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getImpressionEvent in New Optimizely with attributes as a string value', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            isGlobalHoldback: false,
            projectId: '111001',
            revision: '42',
            decision: {
              variationId: '111128',
              isLayerHoldback: false,
              experimentId: '111127',
            },
            layerId: '4',
            accountId: '12001',
            userFeatures: [
              {
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              },
            ],
          },
        };

        var eventOptions = {
          attributes: {browser_type: 'firefox'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getImpressionEvent in New Optimizely with attributes as a false value', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            isGlobalHoldback: false,
            projectId: '111001',
            revision: '42',
            decision: {
              variationId: '111128',
              isLayerHoldback: false,
              experimentId: '111127',
            },
            layerId: '4',
            accountId: '12001',
            userFeatures: [
              {
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: false,
                shouldIndex: true,
              },
            ],
          },
        };

        var eventOptions = {
          attributes: {browser_type: false},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getImpressionEvent in New Optimizely with attributes as a zero value', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            isGlobalHoldback: false,
            projectId: '111001',
            revision: '42',
            decision: {
              variationId: '111128',
              isLayerHoldback: false,
              experimentId: '111127',
            },
            layerId: '4',
            accountId: '12001',
            userFeatures: [
              {
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 0,
                shouldIndex: true,
              },
            ],
          },
        };

        var eventOptions = {
          attributes: {browser_type: 0},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should not fill in userFeatures for getImpressionEvent when attribute is not in datafile in Optimizely X', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/decision',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            isGlobalHoldback: false,
            projectId: '111001',
            revision: '42',
            decision: {
              variationId: '111128',
              isLayerHoldback: false,
              experimentId: '111127',
            },
            layerId: '4',
            accountId: '12001',
            userFeatures: [],
          },
        };

        var eventOptions = {
          attributes: {invalid_attribute: 'sorry_not_sorry'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          experimentKey: 'testExperiment',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });
    });

    describe('getConversionEvent', function() {
      it('should create proper params for getConversionEvent in Classic Optimizely', function() {
        expectedConversionParams = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            d: '12001',
            a: '111001',
            n: 'testEvent',
            'x111127': '111128',
            g: '111095',
            u: 'testUser',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0)
          },
        };

        // without attributes or event value
        var expected1 = _.cloneDeep(expectedConversionParams);

        // with attributes
        var expected2 = _.cloneDeep(expectedConversionParams);
        expected2.params.s5175100584230912 = 'firefox';

        // with event value
        var expected3 = _.cloneDeep(expectedConversionParams);
        expected3.params.v = 4200;
        expected3.params.g = '111095,111096';

        // with false as attribute value
        var expected4 = _.cloneDeep(expectedConversionParams);
        expected4.params.s5175100584230912 = false;

        // with 0 as attribute value
        var expected5 = _.cloneDeep(expectedConversionParams);
        expected5.params.s5175100584230912 = 0;

        var eventOptions1 = {
          attributes: undefined,
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };
        var conversionEventParams1 = eventBuilder.getConversionEvent(eventOptions1);

        var eventOptions2 = {
          attributes: {browser_type: 'firefox'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {
            revenue: undefined,
          },
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };
        var conversionEventParams2 = eventBuilder.getConversionEvent(eventOptions2);

        var eventOptions3 = {
          attributes: undefined,
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {
            revenue: 4200,
          },
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };
        var conversionEventParams3 = eventBuilder.getConversionEvent(eventOptions3);

        var eventOptions3 = {
          attributes: {browser_type: false},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {},
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };
        var conversionEventParams4 = eventBuilder.getConversionEvent(eventOptions3);

        var eventOptions4 = {
          attributes: {browser_type: 0},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };
        var conversionEventParams5 = eventBuilder.getConversionEvent(eventOptions4);

        assert.deepEqual(expected1, conversionEventParams1);
        assert.deepEqual(expected2, conversionEventParams2);
        assert.deepEqual(expected3, conversionEventParams3);
        assert.deepEqual(expected4, conversionEventParams4);
        assert.deepEqual(expected5, conversionEventParams5);
      });

      it('should create proper params for getConversionEvent in Classic Optimizely with invalid attribute', function() {
        expectedConversionParams = {
          url: 'https://111001.log.optimizely.com/event',
          httpVerb: 'GET',
          params: {
            d: '12001',
            a: '111001',
            n: 'testEvent',
            'x111127': '111128',
            g: '111095',
            u: 'testUser',
            src: sprintf('node-sdk-%s', packageJSON.version),
            time: Math.round(new Date().getTime() / 1000.0)
          },
        };

        var eventOptions = {
          attributes: {invalid_attribute: 'sorry_not_sorry'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };
        var conversionEventParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(conversionEventParams, expectedConversionParams);
      });

      it('should create proper params for getConversionEvent in New Optimizely without attributes or event value', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            projectId: '111001',
            revision: '42',
            accountId: '12001',
            userFeatures: [],
            layerStates: [{
              layerId: '4',
              revision: '42',
              decision: {
                variationId: '111128',
                isLayerHoldback: false,
                experimentId: '111127',
              },
              actionTriggered: true,
            }],
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventMetrics: [],
            eventFeatures: [],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          eventKey: 'testEvent',
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent in New Optimizely with attributes', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            projectId: '111001',
            revision: '42',
            accountId: '12001',
            userFeatures: [{
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              }],
            layerStates: [{
              layerId: '4',
              revision: '42',
              decision: {
                variationId: '111128',
                isLayerHoldback: false,
                experimentId: '111127',
              },
              actionTriggered: true,
            }],
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventMetrics: [],
            eventFeatures: [],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          attributes: {browser_type: 'firefox'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          eventKey: 'testEvent',
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent in New Optimizely with event value', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            projectId: '111001',
            revision: '42',
            accountId: '12001',
            userFeatures: [],
            layerStates: [{
              layerId: '4',
              revision: '42',
              decision: {
                variationId: '111128',
                isLayerHoldback: false,
                experimentId: '111127',
              },
              actionTriggered: true,
            }],
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventMetrics: [{
              name: 'revenue',
              value: 4200,
            }],
            eventFeatures: [{
              "id": "revenue",
              "type": 'custom',
              "value": 4200,
              "shouldIndex": false,
            }],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          eventKey: 'testEvent',
          eventTags: {
            revenue: 4200,
          },
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent in New Optimizely with attributes and event value', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            projectId: '111001',
            revision: '42',
            accountId: '12001',
            userFeatures: [{
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              }],
            layerStates: [{
              layerId: '4',
              revision: '42',
              decision: {
                variationId: '111128',
                isLayerHoldback: false,
                experimentId: '111127',
              },
              actionTriggered: true,
            }],
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventMetrics: [{
              name: 'revenue',
              value: 4200,
            }],
            eventFeatures: [{
              "id": "revenue",
              "type": 'custom',
              "value": 4200,
              "shouldIndex": false,
            }],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          attributes: {browser_type: 'firefox'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          eventKey: 'testEvent',
          eventTags: {
            revenue: 4200
          },
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent in New Optimizely with attributes and revenue', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            projectId: '111001',
            revision: '42',
            accountId: '12001',
            userFeatures: [{
                id: '111094',
                name: 'browser_type',
                type: 'custom',
                value: 'firefox',
                shouldIndex: true,
              }],
            layerStates: [{
              layerId: '4',
              revision: '42',
              decision: {
                variationId: '111128',
                isLayerHoldback: false,
                experimentId: '111127',
              },
              actionTriggered: true,
            }],
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventMetrics: [{
              name: 'revenue',
              value: 4200,
            }],
            eventFeatures: [{
              "id": "revenue",
              "type": 'custom',
              "value": 4200,
              "shouldIndex": false,
            }],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          attributes: {browser_type: 'firefox'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          eventKey: 'testEvent',
          eventTags: {
            revenue: 4200,
          },
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should not fill in userFeatures for getConversion when attribute is not in datafile in Optimizely X', function() {
        var expectedParams = {
          url: 'https://logx.optimizely.com/log/event',
          httpVerb: 'POST',
          params: {
            visitorId: 'testUser',
            timestamp: Math.round(new Date().getTime()),
            clientEngine: 'node-sdk',
            clientVersion: packageJSON.version,
            projectId: '111001',
            revision: '42',
            accountId: '12001',
            userFeatures: [],
            layerStates: [{
              layerId: '4',
              revision: '42',
              decision: {
                variationId: '111128',
                isLayerHoldback: false,
                experimentId: '111127',
              },
              actionTriggered: true,
            }],
            eventEntityId: '111095',
            eventName: 'testEvent',
            eventMetrics: [],
            eventFeatures: [],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          attributes: {invalid_attribute: 'sorry_not_sorry'},
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObjNewOptly,
          eventKey: 'testEvent',
          userId: 'testUser',
          variationIds: ['111128'],
          validExperimentKeysForEvent: ['testExperiment'],
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

    });
  });
});
