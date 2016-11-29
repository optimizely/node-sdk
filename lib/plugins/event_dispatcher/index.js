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
var request = require('request-promise');

var POST_METHOD = 'POST';
var POST_HEADERS = {'content-type': 'application/json'};

module.exports = {
  /**
   * Dispatch an HTTP request to the given url and the specified options
   * @param {Object}  eventObj          Event object containing
   * @param {string}  eventObj.url      the url to make the request to
   * @param {Object}  eventObj.params   parameters to pass to the request
   * @param {string}  eventObj.httpVerb the HTTP request method type
   * @return {Promise<Object>}          the payload from the request
   */
  dispatchEvent: function(eventObj) {
    if (eventObj.httpVerb === POST_METHOD) {
      var requestOptions = {
        uri: eventObj.url,
        body: eventObj.params,
        headers: POST_HEADERS,
        method: eventObj.httpVerb,
        json: true,
      };
    } else {
      var requestOptions = {
        uri: eventObj.url,
        qs: eventObj.params,
        method: eventObj.httpVerb,
        json: true,
      };
    }

    return request(requestOptions);
  }
};
