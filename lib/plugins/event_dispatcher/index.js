var request = require('request-promise');

module.exports = {
  /**
   * Dispatch an HTTP request to the given url and the specified options
   * @param {string}  url    the url to make the request to
   * @param {Object}  params parameters to pass to the request
   * @return {Promise<Object>} the payload from the request
   */
  dispatchEvent: function(url, params) {
    var requestOptions = {
      url: url,
      qs: params,
      json: true,
    };

    return request(requestOptions);
  }
};
