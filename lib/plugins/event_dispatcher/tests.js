var eventDispatcher = require('./');
var chai = require('chai');
var assert = chai.assert;
var nock = require('nock');

describe('lib/plugins/event_dispatcher', function() {
  describe('APIs', function() {
    describe('dispatchEvent', function() {

      beforeEach(function() {
        nock('https://cdn.com')
          .get('/projectJSON')
          .reply(200, {
            experimentId: 123,
          })
          .get('/event?id=123')
          .reply(200, {
            ok: true,
          });
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should send a GET request if no params are specified', function(done) {
        eventDispatcher.dispatchEvent('https://cdn.com/projectJSON')
          .then(function(response) {
            assert.equal(response.experimentId, 123);
            done();
          });
      });

      it('should send a GET request with the specified params', function(done) {
        eventDispatcher.dispatchEvent('https://cdn.com/event', { id: 123 })
          .then(function(response) {
            assert.isTrue(response.ok);
            done();
          });
      });
    });
  });
});
