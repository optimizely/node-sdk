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
var cloneDeep = require('lodash/cloneDeep');

var config = {
  revision: '42',
  version: '2',
  events: [
    {
      key: 'testEvent',
      experimentIds: ['111127'],
      id: '111095'
    },
    {
      key: 'Total Revenue',
      experimentIds: ['111127'],
      id: '111096'
    },
    {
      key: 'testEventWithAudiences',
      experimentIds: ['122227'],
      id: '111097'
    },
    {
      key: 'testEventWithoutExperiments',
      experimentIds: [],
      id: '111098'
    },
    {
      key: 'testEventWithExperimentNotRunning',
      experimentIds: ['133337'],
      id: '111099'
    },
    {
      key: 'testEventWithMultipleExperiments',
      experimentIds: ['111127', '122227', '133337'],
      id: '111100'
    },
    {
      key: 'testEventLaunched',
      experimentIds: ['144447'],
      id: '111101'
    }
  ],
  groups: [
    {
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
        forcedVariations: {},
        layerId: '1'
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
        forcedVariations: {},
        layerId: '2'
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
        forcedVariations: {},
        layerId: '3'
      }]
    }
  ],
  experiments: [
    {
      key: 'testExperiment',
      status: 'Running',
      forcedVariations: {
        'user1': 'control',
        'user2': 'variation'
      },
      audienceIds: [],
      layerId: '4',
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
      forcedVariations: {
        'user1': 'controlWithAudience',
        'user2': 'variationWithAudience'
      },
      audienceIds: ['11154'],
      layerId: '5',
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
      forcedVariations: {
        'user1': 'controlNotRunning',
        'user2': 'variationNotRunning'
      },
      audienceIds: [],
      layerId: '6',
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
    }, {
      key: 'testExperimentLaunched',
      status: 'Launched',
      forcedVariations: {},
      audienceIds: [],
      layerId: '7',
      trafficAllocation: [{
        entityId: '144448',
        endOfRange: 5000,
      }, {
        entityId: '144449',
        endOfRange: 10000
      }],
      id: '144447',
      variations: [{
        key: 'controlLaunched',
        id: '144448'
      }, {
        key: 'variationLaunched',
        id: '144449'
      }]
    }],
    accountId: '12001',
    attributes: [{
      key: 'browser_type',
      id: '111094'
    }
  ],
  audiences: [{
    name: 'Firefox users',
    conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_attribute", "value": "firefox"}]]]',
    id: '11154'
  }],
  projectId: '111001'
};

var getParsedAudiences = [{
  name: 'Firefox users',
  conditions: ["and", ["or", ["or", {"name": "browser_type", "type": "custom_attribute", "value": "firefox"}]]],
  id: '11154'
}];

var getTestProjectConfig = function() {
  return cloneDeep(config);
};

var configWithFeatures = {
  'attributes': [{ 'id': '594014', 'key': 'test_attribute' }],
  'anonymizeIP': true,
  'version': '4',
  'groups': [{
    'id': '595024',
    'trafficAllocation': [{ 'endOfRange': 5000, 'entityId': '595010' }],
    'experiments': [{
      'forcedVariations': {},
      'status': 'Running',
      'key': 'exp_with_group',
      'id': '595010',
      'variations': [{ 'id': '595008', 'variables': [], 'key': 'var' }, {
        'id': '595009',
        'variables': [],
        'key': 'con'
      }],
      'audienceIds': [],
      'trafficAllocation': [{ 'endOfRange': 5000, 'entityId': '595008' }, {
        'endOfRange': 10000,
        'entityId': '595009'
      }],
      'layerId': '595005'
    }],
    'policy': 'random'
  }],
  'featureFlags': [{
    'experimentIds': [],
    'id': '594021',
    'variables': [{
      'id': '4919852825313280',
      'type': 'boolean',
      'defaultValue': 'false',
      'key': 'new_content'
    }, {
      'id': '5482802778734592',
      'type': 'integer',
      'defaultValue': '400',
      'key': 'lasers'
    }, {
      'id': '6045752732155904',
      'type': 'double',
      'defaultValue': '14.99',
      'key': 'price'
    }, { 'id': '6327227708866560', 'type': 'string', 'defaultValue': 'Hello', 'key': 'message' }],
    'key': 'test_feature',
    'rolloutId': '594030'
  }, {
    'experimentIds': [],
    'id': '594050',
    'variables': [{
      'id': '5060590313668608',
      'type': 'double',
      'defaultValue': '30.34',
      'key': 'miles_to_the_wall'
    }, {
      'id': '5342065290379264',
      'type': 'string',
      'defaultValue': 'Winter is coming',
      'key': 'motto'
    }, {
      'id': '6186490220511232',
      'type': 'integer',
      'defaultValue': '1000',
      'key': 'soldiers_available'
    }, { 'id': '6467965197221888', 'type': 'boolean', 'defaultValue': 'true', 'key': 'is_winter_coming' }],
    'key': 'test_feature_2',
    'rolloutId': '594059'
  }, {
    'experimentIds': ['594098'],
    'id': '594081',
    'variables': [{
      'id': '4792309476491264',
      'type': 'integer',
      'defaultValue': '10',
      'key': 'num_buttons'
    }, {
      'id': '5073784453201920',
      'type': 'boolean',
      'defaultValue': 'false',
      'key': 'is_button_animated'
    }, {
      'id': '5636734406623232',
      'type': 'string',
      'defaultValue': 'Buy me',
      'key': 'button_txt'
    }, { 'id': '6199684360044544', 'type': 'double', 'defaultValue': '50.55', 'key': 'button_width' }],
    'key': 'test_feature_for_experiment',
    'rolloutId': ''
  }, { 'experimentIds': ['595010'], 'id': '595001', 'variables': [], 'key': 'feature_with_group', 'rolloutId': '' }],
  'variables': [],
  'revision': '18',
  'experiments': [{
    'forcedVariations': {},
    'status': 'Running',
    'key': 'testing_my_feature',
    'id': '594098',
    'variations': [{
      'id': '594096',
      'variables': [{ 'id': '4792309476491264', 'value': '2' }, {
        'id': '5073784453201920',
        'value': 'true'
      }, { 'id': '5636734406623232', 'value': 'Buy me NOW' }, { 'id': '6199684360044544', 'value': '20.25' }],
      'key': 'variation'
    }, {
      'id': '594097',
      'variables': [{ 'id': '4792309476491264', 'value': '10' }, {
        'id': '5073784453201920',
        'value': 'false'
      }, { 'id': '5636734406623232', 'value': 'Buy me' }, { 'id': '6199684360044544', 'value': '50.55' }],
      'key': 'control'
    }],
    'audienceIds': [],
    'trafficAllocation': [{ 'endOfRange': 5000, 'entityId': '594096' }, { 'endOfRange': 10000, 'entityId': '594097' }],
    'layerId': '594093'
  }],
  'audiences': [{
    'conditions': '["and", ["or", ["or", {"name": "test_attribute", "value": "test_value", "type": "custom_attribute"}]]]',
    'name': 'test_audience',
    'id': '594017'
  }],
  'projectId': '594001',
  'accountId': '572018',
  'rollouts': [{
    'id': '594030',
    'experiments': [{
      'forcedVariations': {},
      'status': 'Not started',
      'key': '594031',
      'id': '594031',
      'variations': [{
        'id': '594032',
        'variables': [{ 'id': '4919852825313280', 'value': 'true' }, {
          'id': '5482802778734592',
          'value': '395'
        }, { 'id': '6045752732155904', 'value': '4.99' }, { 'id': '6327227708866560', 'value': 'Hello audience' }],
        'key': '594032'
      }],
      'audienceIds': ['594017'],
      'trafficAllocation': [{ 'endOfRange': 5000, 'entityId': '594032' }],
      'layerId': '594030'
    }, {
      'forcedVariations': {},
      'status': 'Not started',
      'key': '594037',
      'id': '594037',
      'variations': [{
        'id': '594038',
        'variables': [{ 'id': '4919852825313280', 'value': 'false' }, {
          'id': '5482802778734592',
          'value': '400'
        }, { 'id': '6045752732155904', 'value': '14.99' }, { 'id': '6327227708866560', 'value': 'Hello' }],
        'key': '594038'
      }],
      'audienceIds': [],
      'trafficAllocation': [{ 'endOfRange': 0, 'entityId': '594038' }],
      'layerId': '594030'
    }]
  }, {
    'id': '594059',
    'experiments': [{
      'forcedVariations': {},
      'status': 'Not started',
      'key': '594060',
      'id': '594060',
      'variations': [{
        'id': '594061',
        'variables': [{ 'id': '5060590313668608', 'value': '27.34' }, {
          'id': '5342065290379264',
          'value': 'Winter is NOT coming'
        }, { 'id': '6186490220511232', 'value': '10003' }, { 'id': '6467965197221888', 'value': 'false' }],
        'key': '594061'
      }],
      'audienceIds': ['594017'],
      'trafficAllocation': [{ 'endOfRange': 10000, 'entityId': '594061' }],
      'layerId': '594059'
    }, {
      'forcedVariations': {},
      'status': 'Not started',
      'key': '594066',
      'id': '594066',
      'variations': [{
        'id': '594067',
        'variables': [{ 'id': '5060590313668608', 'value': '30.34' }, {
          'id': '5342065290379264',
          'value': 'Winter is coming definitely'
        }, { 'id': '6186490220511232', 'value': '500' }, { 'id': '6467965197221888', 'value': 'true' }],
        'key': '594067'
      }],
      'audienceIds': [],
      'trafficAllocation': [{ 'endOfRange': 10000, 'entityId': '594067' }],
      'layerId': '594059'
    }]
  }],
  'events': [{ 'experimentIds': ['594098', '595010'], 'id': '594089', 'key': 'item_bought' }]
};

var getTestProjectConfigWithFeatures = function() {
  return cloneDeep(configWithFeatures);
};

var datafileWithFeaturesExpectedData = {
  rolloutIdMap: {
    594030: {
      experiments: [
        {
          'audienceIds': [
            '594017'
          ],
          'status': 'Not started',
          'layerId': '594030',
          'forcedVariations': {},
          'variations': [
            {
              'variables': [
                {
                  'value': 'true',
                  'id': '4919852825313280'
                },
                {
                  'value': '395',
                  'id': '5482802778734592'
                },
                {
                  'value': '4.99',
                  'id': '6045752732155904'
                },
                {
                  'value': 'Hello audience',
                  'id': '6327227708866560'
                }
              ],
              'key': '594032',
              'id': '594032'
            }
          ],
          'trafficAllocation': [
            {
              'entityId': '594032',
              'endOfRange': 5000
            }
          ],
          'key': '594031',
          'id': '594031',
          variationKeyMap: {
            594032: {
              'variables': [
                {
                  'value': 'true',
                  'id': '4919852825313280'
                },
                {
                  'value': '395',
                  'id': '5482802778734592'
                },
                {
                  'value': '4.99',
                  'id': '6045752732155904'
                },
                {
                  'value': 'Hello audience',
                  'id': '6327227708866560'
                }
              ],
              'key': '594032',
              'id': '594032'
            }
          },
        },
        {
          'audienceIds': [],
          'status': 'Not started',
          'layerId': '594030',
          'forcedVariations': {},
          'variations': [
            {
              'variables': [
                {
                  'value': 'false',
                  'id': '4919852825313280'
                },
                {
                  'value': '400',
                  'id': '5482802778734592'
                },
                {
                  'value': '14.99',
                  'id': '6045752732155904'
                },
                {
                  'value': 'Hello',
                  'id': '6327227708866560'
                }
              ],
              'key': '594038',
              'id': '594038'
            }
          ],
          'trafficAllocation': [
            {
              'entityId': '594038',
              'endOfRange': 0
            }
          ],
          'key': '594037',
          'id': '594037',
          variationKeyMap: {
            594038: {
              'variables': [
                {
                  'value': 'false',
                  'id': '4919852825313280'
                },
                {
                  'value': '400',
                  'id': '5482802778734592'
                },
                {
                  'value': '14.99',
                  'id': '6045752732155904'
                },
                {
                  'value': 'Hello',
                  'id': '6327227708866560'
                }
              ],
              'key': '594038',
              'id': '594038'
            },
          },
        }
      ],
      id: '594030',
    },
    594059: {
      experiments: [
        {
          'audienceIds': [
            '594017'
          ],
          'status': 'Not started',
          'layerId': '594059',
          'forcedVariations': {},
          'variations': [
            {
              'variables': [
                {
                  'value': '27.34',
                  'id': '5060590313668608'
                },
                {
                  'value': 'Winter is NOT coming',
                  'id': '5342065290379264'
                },
                {
                  'value': '10003',
                  'id': '6186490220511232'
                },
                {
                  'value': 'false',
                  'id': '6467965197221888'
                }
              ],
              'key': '594061',
              'id': '594061'
            }
          ],
          'trafficAllocation': [
            {
              'entityId': '594061',
              'endOfRange': 10000
            }
          ],
          'key': '594060',
          'id': '594060',
          variationKeyMap: {
            594061: {
              'variables': [
                {
                  'value': '27.34',
                  'id': '5060590313668608'
                },
                {
                  'value': 'Winter is NOT coming',
                  'id': '5342065290379264'
                },
                {
                  'value': '10003',
                  'id': '6186490220511232'
                },
                {
                  'value': 'false',
                  'id': '6467965197221888'
                }
              ],
              'key': '594061',
              'id': '594061'
            },
          },
        },
        {
          'audienceIds': [],
          'status': 'Not started',
          'layerId': '594059',
          'forcedVariations': {},
          'variations': [
            {
              'variables': [
                {
                  'value': '30.34',
                  'id': '5060590313668608'
                },
                {
                  'value': 'Winter is coming definitely',
                  'id': '5342065290379264'
                },
                {
                  'value': '500',
                  'id': '6186490220511232'
                },
                {
                  'value': 'true',
                  'id': '6467965197221888'
                }
              ],
              'key': '594067',
              'id': '594067'
            }
          ],
          'trafficAllocation': [
            {
              'entityId': '594067',
              'endOfRange': 10000
            }
          ],
          'key': '594066',
          'id': '594066',
          variationKeyMap: {
            594067: {
              'variables': [
                {
                  'value': '30.34',
                  'id': '5060590313668608'
                },
                {
                  'value': 'Winter is coming definitely',
                  'id': '5342065290379264'
                },
                {
                  'value': '500',
                  'id': '6186490220511232'
                },
                {
                  'value': 'true',
                  'id': '6467965197221888'
                }
              ],
              'key': '594067',
              'id': '594067'
            },
          },
        },
      ],
      id: '594059',
    },
  },

  variationVariableUsageMap: {
    594032: {
      4919852825313280: {
        id: '4919852825313280',
        value: 'true',
      },
      5482802778734592: {
        id: '5482802778734592',
        value: '395',
      },
      6045752732155904: {
        id: '6045752732155904',
        value: '4.99',
      },
      6327227708866560: {
        id: '6327227708866560',
        value: 'Hello audience',
      },
    },
    594038: {
      4919852825313280: {
        id: '4919852825313280',
        value: 'false',
      },
      5482802778734592: {
        id: '5482802778734592',
        value: '400',
      },
      6045752732155904: {
        id: '6045752732155904',
        value: '14.99',
      },
      6327227708866560: {
        id: '6327227708866560',
        value: 'Hello',
      },
    },
    594061: {
      5060590313668608: {
        id: '5060590313668608',
        value: '27.34',
      },
      5342065290379264: {
        id: '5342065290379264',
        value: 'Winter is NOT coming',
      },
      6186490220511232: {
        id: '6186490220511232',
        value: '10003',
      },
      6467965197221888: {
        id: '6467965197221888',
        value: 'false',
      },
    },
    594067: {
      5060590313668608: {
        id: '5060590313668608',
        value: '30.34',
      },
      5342065290379264: {
        id: '5342065290379264',
        value: 'Winter is coming definitely',
      },
      6186490220511232: {
        id: '6186490220511232',
        value: '500',
      },
      6467965197221888: {
        id: '6467965197221888',
        value: 'true',
      },
    },
    594096: {
      4792309476491264: {
        'value': '2',
        'id': '4792309476491264',
      },
      5073784453201920: {
        'value': 'true',
        'id': '5073784453201920'
      },
      5636734406623232: {
        'value': 'Buy me NOW',
        'id': '5636734406623232'
      },
      6199684360044544: {
        'value': '20.25',
        'id': '6199684360044544'
      },
    },
    594097: {
      4792309476491264: {
        'value': '10',
        'id': '4792309476491264'
      },
      5073784453201920: {
        'value': 'false',
        'id': '5073784453201920'
      },
      5636734406623232: {
        'value': 'Buy me',
        'id': '5636734406623232'
      },
      6199684360044544: {
        'value': '50.55',
        'id': '6199684360044544'
      },
    },
    595008: {},
    595009: {},
  },

  featureKeyMap: {
    test_feature: {
      'variables': [{
        'defaultValue': 'false',
        'key': 'new_content',
        'type': 'boolean',
        'id': '4919852825313280'
      }, {
        'defaultValue': '400',
        'key': 'lasers',
        'type': 'integer',
        'id': '5482802778734592'
      }, {
        'defaultValue': '14.99',
        'key': 'price',
        'type': 'double',
        'id': '6045752732155904'
      }, {
        'defaultValue': 'Hello',
        'key': 'message',
        'type': 'string',
        'id': '6327227708866560'
      }],
      'experimentIds': [],
      'rolloutId': '594030',
      'key': 'test_feature',
      'id': '594021',
      variableKeyMap: {
        new_content: {
          'defaultValue': 'false',
          'key': 'new_content',
          'type': 'boolean',
          'id': '4919852825313280'
        },
        lasers: {
          'defaultValue': '400',
          'key': 'lasers',
          'type': 'integer',
          'id': '5482802778734592'
        },
        price: {
          'defaultValue': '14.99',
          'key': 'price',
          'type': 'double',
          'id': '6045752732155904'
        },
        message: {
          'defaultValue': 'Hello',
          'key': 'message',
          'type': 'string',
          'id': '6327227708866560'
        },
      },
    },
    test_feature_2: {
      'variables': [{
        'defaultValue': '30.34',
        'key': 'miles_to_the_wall',
        'type': 'double',
        'id': '5060590313668608'
      }, {
        'defaultValue': 'Winter is coming',
        'key': 'motto',
        'type': 'string',
        'id': '5342065290379264'
      }, {
        'defaultValue': '1000',
        'key': 'soldiers_available',
        'type': 'integer',
        'id': '6186490220511232'
      }, {
        'defaultValue': 'true',
        'key': 'is_winter_coming',
        'type': 'boolean',
        'id': '6467965197221888',
      }],
      'experimentIds': [],
      'rolloutId': '594059',
      'key': 'test_feature_2',
      'id': '594050',
      variableKeyMap: {
        miles_to_the_wall: {
          'defaultValue': '30.34',
          'key': 'miles_to_the_wall',
          'type': 'double',
          'id': '5060590313668608'
        },
        motto: {
          'defaultValue': 'Winter is coming',
          'key': 'motto',
          'type': 'string',
          'id': '5342065290379264'
        },
        soldiers_available: {
          'defaultValue': '1000',
          'key': 'soldiers_available',
          'type': 'integer',
          'id': '6186490220511232'
        },
        is_winter_coming: {
          'defaultValue': 'true',
          'key': 'is_winter_coming',
          'type': 'boolean',
          'id': '6467965197221888',
        },
      }
    },
    test_feature_for_experiment: {
      'variables': [{
        'defaultValue': '10',
        'key': 'num_buttons',
        'type': 'integer',
        'id': '4792309476491264'
      }, {
        'defaultValue': 'false',
        'key': 'is_button_animated',
        'type': 'boolean',
        'id': '5073784453201920'
      }, {
        'defaultValue': 'Buy me',
        'key': 'button_txt',
        'type': 'string',
        'id': '5636734406623232'
      }, {
        'defaultValue': '50.55',
        'key': 'button_width',
        'type': 'double',
        'id': '6199684360044544',
      }],
      'experimentIds': ['594098'],
      'rolloutId': '',
      'key': 'test_feature_for_experiment',
      'id': '594081',
      variableKeyMap: {
        num_buttons: {
          'defaultValue': '10',
          'key': 'num_buttons',
          'type': 'integer',
          'id': '4792309476491264'
        },
        is_button_animated: {
          'defaultValue': 'false',
          'key': 'is_button_animated',
          'type': 'boolean',
          'id': '5073784453201920'
        },
        button_txt: {
          'defaultValue': 'Buy me',
          'key': 'button_txt',
          'type': 'string',
          'id': '5636734406623232'
        },
        button_width: {
          'defaultValue': '50.55',
          'key': 'button_width',
          'type': 'double',
          'id': '6199684360044544',
        },
      },
    },
    // This feature should have a groupId assigned because its experiment is in a group
    feature_with_group: {
      'variables': [],
      'rolloutId': '',
      'experimentIds': ['595010'],
      'key': 'feature_with_group',
      'id': '595001',
      variableKeyMap: {},
      groupId: '595024',
    },
  },
};

module.exports = {
  getTestProjectConfig: getTestProjectConfig,
  getParsedAudiences: getParsedAudiences,
  getTestProjectConfigWithFeatures: getTestProjectConfigWithFeatures,
  datafileWithFeaturesExpectedData: datafileWithFeaturesExpectedData,
};
