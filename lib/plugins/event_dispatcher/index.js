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
