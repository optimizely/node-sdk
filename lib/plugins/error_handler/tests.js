var errorHandler = require('./');

var chai = require('chai');
var assert = chai.assert;

describe('lib/plugins/error_handler', function() {
  describe('APIs', function() {
    describe('handleError', function() {
      it('should just be a no-op function', function() {
        assert.isFunction(errorHandler.handleError);
      });
    });
  });
});
