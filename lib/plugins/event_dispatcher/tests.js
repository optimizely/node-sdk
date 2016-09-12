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
          })
          .post('/event')
          .reply(200, {
            ok: true,
          });
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should send a GET request if no params are specified', function(done) {
        var eventObj = {
          url: 'https://cdn.com/projectJSON',
          params: {},
        };
        eventDispatcher.dispatchEvent(eventObj)
          .then(function(response) {
            assert.equal(response.experimentId, 123);
            done();
          });
      });

      it('should send a GET request with the specified params if httpVerb is GET', function(done) {
        var eventObj = {
          url: 'https://cdn.com/event',
          params: {
            id: 123,
          },
          httpVerb: 'GET',
        };
        eventDispatcher.dispatchEvent(eventObj)
          .then(function(response) {
            assert.isTrue(response.ok);
            done();
          });
      });

      it('should send a POST request with the specified params if httpVerb is POST', function(done) {
        var eventObj = {
          url: 'https://cdn.com/event',
          body: {
            id: 123,
          },
          httpVerb: 'POST',
        };
        eventDispatcher.dispatchEvent(eventObj)
          .then(function(response) {
            assert.isTrue(response.ok);
            done();
          });
      });
    });
  });
});
