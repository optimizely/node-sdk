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
