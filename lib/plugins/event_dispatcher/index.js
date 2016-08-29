var request = require('request-promise');

module.exports = {
  /**
   * Dispatch an HTTP request to the given url and the specified options
   * @param {Object}  eventObj        Event object containing
   * @param {string}  eventObj.url    the url to make the request to
   * @param {Object}  eventObj.params parameters to pass to the request
   * @return {Promise<Object>}        the payload from the request
   */
  dispatchEvent: function(eventObj) {
    var requestOptions = {
      url: eventObj.url,
      qs: eventObj.params,
      json: true,
    };

    return request(requestOptions);
  }
};
