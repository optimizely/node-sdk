var cloneDeep = require('lodash/cloneDeep');

var config = {
  revision: '42',
  version: '9001',
  events: [{
    key: 'testEvent',
    experimentIds: ['111127'],
    id: '111095'
  }, {
    key: 'Total Revenue',
    experimentIds: ['111127'],
    id: '111096'
  }, {
    key: 'testEventWithAudiences',
    experimentIds: ['122227'],
    id: '111097'
  }, {
    key: 'testEventWithoutExperiments',
    experimentIds: [],
    id: '111098'
  }, {
    key: 'testEventWithExperimentNotRunning',
    experimentIds: ['133337'],
    id: '111099'
  }, {
    key: 'testEventWithMultipleExperiments',
    experimentIds: ['111127', '122227', '133337'],
    id: '111100'
  }],
  groups: [{
    id: '666',
    policy: 'random',
    trafficAllocation: [{
      entityId: '442',
      endOfRange: 3000
    }, {
      entityId: '443',
      endOfRange: 6000
    }],
    experiments: [{
      id: '442',
      key: 'groupExperiment1',
      status: 'Running',
      variations: [{
        id: '551',
        key: 'var1exp1'
      }, {
        id: '552',
        key: 'var2exp1'
      }],
      trafficAllocation: [{
        entityId: '551',
        endOfRange: 5000
      }, {
        entityId: '552',
        endOfRange: 9000
      }, {
        entityId: '',
        endOfRange: 10000
      }],
      audienceIds: ['11154'],
      forcedVariations: {}
    }, {
      id: '443',
      key: 'groupExperiment2',
      status: 'Running',
      variations: [{
        id: '661',
        key: 'var1exp2'
      }, {
        id: '662',
        key: 'var2exp2'
      }],
      trafficAllocation: [{
        entityId: '661',
        endOfRange: 5000
      }, {
        entityId: '662',
        endOfRange: 10000
      }],
      audienceIds: [],
      forcedVariations: {}
    }]
  }, {
    id: '667',
    policy: 'overlapping',
    trafficAllocation: [],
    experiments: [{
      id: '444',
      key: 'overlappingGroupExperiment1',
      status: 'Running',
      variations: [{
        id: '553',
        key: 'overlappingvar1'
      }, {
        id: '554',
        key: 'overlappingvar2'
      }],
      trafficAllocation: [{
        entityId: '553',
        endOfRange: 1500
      }, {
        entityId: '554',
        endOfRange: 3000
      }],
      audienceIds: [],
      forcedVariations: {}
    }]
  }],
  experiments: [{
    key: 'testExperiment',
    status: 'Running',
    forcedVariations: {
      'user1': 'control',
      'user2': 'variation'
    },
    audienceIds: [],
    trafficAllocation: [{
      entityId: '111128',
      endOfRange: 4000
    }, {
      entityId: '111129',
      endOfRange: 9000
    }],
    id: '111127',
    variations: [{
      key: 'control',
      id: '111128'
    }, {
      key: 'variation',
      id: '111129'
    }]
  }, {
    key: 'testExperimentWithAudiences',
    status: 'Running',
    forcedVariations: {},
    audienceIds: ['11154'],
    trafficAllocation: [{
      entityId: '122228',
      endOfRange: 4000,
    }, {
      entityId: '122229',
      endOfRange: 10000
    }],
    id: '122227',
    variations: [{
      key: 'controlWithAudience',
      id: '122228'
    }, {
      key: 'variationWithAudience',
      id: '122229'
    }]
  }, {
    key: 'testExperimentNotRunning',
    status: 'Not started',
    forcedVariations: {},
    audienceIds: [],
    trafficAllocation: [{
      entityId: '133338',
      endOfRange: 4000
    }, {
      entityId: '133339',
      endOfRange: 10000
    }],
    id: '133337',
    variations: [{
      key: 'controlNotRunning',
      id: '133338'
    }, {
      key: 'variationNotRunning',
      id: '133339'
    }]
  }],
  accountId: '12001',
  dimensions: [{
    key: 'browser_type',
    id: '111094',
    segmentId: '5175100584230912'
  }],
  audiences: [{
    name: 'Firefox users',
    conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "firefox"}]]]',
    id: '11154'
  }],
  projectId: '111001'
};

var getParsedAudiences = [{
  name: 'Firefox users',
  conditions: ["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "firefox"}]]],
  id: '11154'
}];

var getTestProjectConfig = function() {
  return cloneDeep(config);
};

module.exports = {
  getTestProjectConfig: getTestProjectConfig,
  getParsedAudiences: getParsedAudiences,
};
