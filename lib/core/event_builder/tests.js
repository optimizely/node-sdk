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
var sinon = require('sinon');

describe('lib/core/event_builder', function() {
  describe('APIs', function() {

    var configObj;
    var clock;

    beforeEach(function() {
      configObj = projectConfig.createProjectConfig(testData.getTestProjectConfig());
      clock = sinon.useFakeTimers(new Date().getTime());
    });

    afterEach(function() {
      clock.restore();
    });

    describe('getImpressionEvent', function() {
      it('should create proper params for getImpressionEvent without attributes', function() {
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
          configObj: configObj,
          experimentId: '111127',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getImpressionEvent with attributes as a string value', function() {
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
          configObj: configObj,
          experimentId: '111127',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getImpressionEvent with attributes as a false value', function() {
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
          configObj: configObj,
          experimentId: '111127',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getImpressionEvent with attributes as a zero value', function() {
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
          configObj: configObj,
          experimentId: '111127',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should not fill in userFeatures for getImpressionEvent when attribute is not in the datafile', function() {
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
          configObj: configObj,
          experimentId: '111127',
          variationId: '111128',
          userId: 'testUser',
        };

        var actualParams = eventBuilder.getImpressionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });
    });

    describe('getConversionEvent', function() {
      it('should create proper params for getConversionEvent without attributes or event value', function() {
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
          configObj: configObj,
          eventKey: 'testEvent',
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent with attributes', function() {
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
          configObj: configObj,
          eventKey: 'testEvent',
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent with event value', function() {
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
              "name": "revenue",
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
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {
            revenue: 4200,
          },
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent with attributes and event value', function() {
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
              "name": "revenue",
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
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {
            revenue: 4200
          },
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent with attributes and revenue', function() {
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
              "name": "revenue",
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
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {
            revenue: 4200,
          },
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent with event tags', function() {
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
            eventFeatures: [{
              "name": "non-revenue",
              "type": 'custom',
              "value": "cool",
              "shouldIndex": false,
            }],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {
            'non-revenue': 'cool',
          },
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should create proper params for getConversionEvent with event tags and revenue', function() {
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
              "name": "revenue",
              "type": 'custom',
              "value": 4200,
              "shouldIndex": false,
            }, {
              "name": "non-revenue",
              "type": 'custom',
              "value": "cool",
              "shouldIndex": false,
            }],
            isGlobalHoldback: false,
          },
        };

        var eventOptions = {
          clientEngine: 'node-sdk',
          clientVersion: packageJSON.version,
          configObj: configObj,
          eventKey: 'testEvent',
          eventTags: {
            'revenue': 4200,
            'non-revenue': 'cool',
          },
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });

      it('should not fill in userFeatures for getConversion when attribute is not in the datafile', function() {
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
          configObj: configObj,
          eventKey: 'testEvent',
          userId: 'testUser',
          experimentsToBucketedVariations: { '111127': '111128' },
        };

        var actualParams = eventBuilder.getConversionEvent(eventOptions);

        assert.deepEqual(actualParams, expectedParams);
      });
    });
  });
});
