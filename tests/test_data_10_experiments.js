/**
 * Copyright 2016, Optimizely
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
  experiments: [
    {
      status: "Running",
      key: "testExperiment4",
      trafficAllocation: [
        {
          entityId: "6373141147",
          endOfRange: 5000
        },
        {
          entityId: "6373141148",
          endOfRange: 10000
        }
      ],
      audienceIds: [ ],
      variations: [
        {
          id: "6373141147",
          key: "control"
        },
        {
          id: "6373141148",
          key: "variation"
        }
      ],
      forcedVariations: { },
      id: "6358043286"
    },
    {
      status: "Running",
      key: "testExperiment5",
      trafficAllocation: [
        {
          entityId: "6335242053",
          endOfRange: 5000
        },
        {
          entityId: "6335242054",
          endOfRange: 10000
        }
      ],
      audienceIds: [ ],
      variations: [
        {
          id: "6335242053",
          key: "control"
        },
        {
          id: "6335242054",
          key: "variation"
        }
      ],
      forcedVariations: { },
      id: "6364835526"
    },
    {
      status: "Paused",
      key: "testExperimentNotRunning",
      trafficAllocation: [
        {
          entityId: "6377281127",
          endOfRange: 5000
        },
        {
          entityId: "6377281128",
          endOfRange: 10000
        }
      ],
      audienceIds: [ ],
      variations: [
        {
          id: "6377281127",
          key: "control"
        },
        {
          id: "6377281128",
          key: "variation"
        }
      ],
      forcedVariations: { },
      id: "6367444440"
    },
    {
      status: "Running",
      key: "testExperiment1",
      trafficAllocation: [
        {
          entityId: "6384330451",
          endOfRange: 5000
        },
        {
          entityId: "6384330452",
          endOfRange: 10000
        }
      ],
      audienceIds: [ ],
      variations: [
        {
          id: "6384330451",
          key: "control"
        },
        {
          id: "6384330452",
          key: "variation"
        }
      ],
      forcedVariations: {
        variation_user: "variation",
        control_user: "control"
      },
      id: "6367863211"
    },
    {
      status: "Running",
      key: "testExperiment3",
      trafficAllocation: [
        {
          entityId: "6376141758",
          endOfRange: 5000
        },
        {
          entityId: "6376141759",
          endOfRange: 10000
        }
      ],
      audienceIds: [ ],
      variations: [
        {
          id: "6376141758",
          key: "control"
        },
        {
          id: "6376141759",
          key: "variation"
        }
      ],
      forcedVariations: { },
      id: "6370392407"
    },
    {
      status: "Running",
      key: "testExperiment6",
      trafficAllocation: [
        {
          entityId: "6379060914",
          endOfRange: 5000
        },
        {
          entityId: "6379060915",
          endOfRange: 10000
        }
      ],
      audienceIds: [ ],
      variations: [
        {
          id: "6379060914",
          key: "control"
        },
        {
          id: "6379060915",
          key: "variation"
        }
      ],
      forcedVariations: {
        forced_variation_user: "variation"
      },
      id: "6370821515"
    },
    {
      status: "Running",
      key: "testExperiment2",
      trafficAllocation: [
        {
          entityId: "6386700062",
          endOfRange: 5000
        },
        {
          entityId: "6386700063",
          endOfRange: 10000
        }
      ],
      audienceIds: [ ],
      variations: [
        {
          id: "6386700062",
          key: "control"
        },
        {
          id: "6386700063",
          key: "variation"
        }
      ],
      forcedVariations: {
        variation_user: "variation",
        control_user: "control"
      },
      id: "6376870125"
    },
    {
      status: "Running",
      key: "testExperimentWithFirefoxAudience",
      trafficAllocation: [
        {
          entityId: "6333082303",
          endOfRange: 5000
        },
        {
          entityId: "6333082304",
          endOfRange: 10000
        }
      ],
      audienceIds: [
        "6369992312"
      ],
      variations: [
        {
          id: "6333082303",
          key: "control"
        },
        {
          id: "6333082304",
          key: "variation"
        }
      ],
      forcedVariations: { },
      id: "6383811281"
    }
  ],
  version: "1",
  audiences: [
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "safari"}]]]',
      id: "6352892614",
      name: "Safari users"
    },
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "android"}]]]',
      id: "6355234780",
      name: "Android users"
    },
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "desktop"}]]]',
      id: "6360574256",
      name: "Desktop users"
    },
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "opera"}]]]',
      id: "6365864533",
      name: "Opera users"
    },
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "tablet"}]]]',
      id: "6369831151",
      name: "Tablet users"
    },
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "firefox"}]]]',
      id: "6369992312",
      name: "Firefox users"
    },
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "chrome"}]]]',
      id: "6373141157",
      name: "Chrome users"
    },
    {
      conditions: '["and", ["or", ["or", {"name": "browser_type", "type": "custom_dimension", "value": "ie"}]]]',
      id: "6378191386",
      name: "IE users"
    }
  ],
  dimensions: [
    {
      id: "6359881003",
      key: "browser_type",
      segmentId: "6380740826"
    }
  ],
  groups: [
    {
      policy: "random",
      trafficAllocation: [ ],
      experiments: [ ],
      id: "6367902163"
    },
    {
      policy: "random",
      trafficAllocation: [ ],
      experiments: [ ],
      id: "6393150032"
    },
    {
      policy: "random",
      trafficAllocation: [
        {
          entityId: "6450630664",
          endOfRange: 5000
        },
        {
          entityId: "6447021179",
          endOfRange: 10000
        }
      ],
      experiments: [
        {
          status: "Running",
          key: "mutex_exp2",
          trafficAllocation: [
            {
              entityId: "6453410972",
              endOfRange: 5000
            },
            {
              entityId: "6453410973",
              endOfRange: 10000
            }
          ],
          audienceIds: [ ],
          variations: [
            {
              id: "6453410972",
              key: "a"
            },
            {
              id: "6453410973",
              key: "b"
            }
          ],
          forcedVariations: {
            user_b: "b",
            user_a: "a"
          },
          id: "6447021179"
        },
        {
          status: "Running",
          key: "mutex_exp1",
          trafficAllocation: [
            {
              entityId: "6451680205",
              endOfRange: 5000
            },
            {
              entityId: "6451680206",
              endOfRange: 10000
            }
          ],
          audienceIds: [
            "6373141157"
          ],
          variations: [
            {
              id: "6451680205",
              key: "a"
            },
            {
              id: "6451680206",
              key: "b"
            }
          ],
          forcedVariations: { },
          id: "6450630664"
        }
      ],
      id: "6436903041"
    }
  ],
  projectId: "6377970066",
  accountId: "6365361536",
  events: [
    {
      experimentIds: [
        "6450630664",
        "6447021179"
      ],
      id: "6370392432",
      key: "testEventWithMultipleGroupedExperiments"
    },
    {
      experimentIds: [
        "6367863211"
      ],
      id: "6372590948",
      key: "testEvent"
    },
    {
      experimentIds: [
        "6364835526",
        "6450630664",
        "6367863211",
        "6376870125",
        "6383811281",
        "6358043286",
        "6370392407",
        "6367444440",
        "6370821515",
        "6447021179"
      ],
      id: "6372952486",
      key: "testEventWithMultipleExperiments"
    },
    {
      experimentIds: [
        "6367444440"
      ],
      id: "6380961307",
      key: "testEventWithExperimentNotRunning"
    },
    {
      experimentIds: [
        "6383811281"
      ],
      id: "6384781388",
      key: "testEventWithAudiences"
    },
    {
      experimentIds: [ ],
      id: "6386521015",
      key: "testEventWithoutExperiments"
    },
    {
      experimentIds: [
        "6450630664",
        "6383811281",
        "6376870125"
      ],
      id: "6316734272",
      key: "Total Revenue"
    }
  ],
  revision: "83"
};

function getTestProjectConfig() {
  return cloneDeep(config);
}

module.exports = {
  getTestProjectConfig: getTestProjectConfig,
};
