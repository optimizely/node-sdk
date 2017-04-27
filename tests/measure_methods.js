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
var bluebird = require('bluebird');
var chai = require('chai');
var assert = chai.assert;
var math = require('mathjs');

var Optimizely = require('../index');

module.exports = {
    /**
   * Instantiates the optimizely object with JSON schema validation and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiation: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Instantiates the optimizely object with logger and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiationWithLogger: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
      logger: {log: function() {}},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Instantiates the optimizely object with error handler and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiationWithErrorHandler: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
      errorHandler: {handleError: function() {}},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Instantiates the optimizely object with logger & error handler and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiationWithLoggerAndErrorHandler: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
      logger: {log: function() {}},
      errorHandler: {handleError: function() {}},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Instantiates the optimizely object without JSON schema validation and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiationWithoutJSONValidation: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      skipJSONValidation: true,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Instantiates the optimizely object without JSON schema validation & with logger and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiationWithoutJSONValidationAndWithLogger: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      skipJSONValidation: true,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
      logger: {log: function() {}},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Instantiates the optimizely object without JSON schema validation & with error handler and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiationWithoutJSONValidationAndWithErrorHandler: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      skipJSONValidation: true,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
      errorHandler: {handleError: function() {}},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Instantiates the optimizely object without JSON schema validation & with logger & error handler and returns the time it took
   * @param  {Object} datafile
   * @return {Number} ms to instantiate
   */
  measureInstantiationWithoutJSONValidationAndWithLoggerAndErrorHandler: function(datafile) {
    var start = module.exports.getTimestamp();
    var optlyInstance = Optimizely.createInstance({
      datafile: datafile,
      skipJSONValidation: true,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
      logger: {log: function() {}},
      errorHandler: {handleError: function() {}},
    });
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.isNotNull(optlyInstance);
    return time;
  },

  /**
   * Calls the activate method on the Optimizely object and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number}
   */
  measureActivate: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.activate('testExperiment2', userId);
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'control');
    return time;
  },

  /**
   * Calls the activate method on the Optimizely object with attributes and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number}
   */
  measureActivateWithAttributes: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.activate('testExperimentWithFirefoxAudience', userId, {'browser_type': 'firefox'});
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'variation');
    return time;
  },

  /**
   * Calls the activate method on the Optimizely object with a forced variation and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number}
   */
  measureActivateWithForcedVariation: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.activate('testExperiment2', userId);
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'variation');
    return time;
  },

  /**
   * Calls the activate method on the Optimizely object with a mutually exclusive grouped experiment and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number}
   */
  measureActivateWithGroupedExperiment: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.activate('mutex_exp2', userId);
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'b');
    return time;
  },

  /**
   * Calls the activate method on the Optimizely object with a mutually exclusive grouped experiment & attributes and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number}
   */
  measureActivateWithGroupedExperimentAndAttributes: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.activate('mutex_exp1', userId, {'browser_type': 'chrome'});
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'a');
    return time;
  },

  /**
   * Calls the get variation method on the Optimizely object and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureGetVariation: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.getVariation('testExperiment2', userId);
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'control');
    return time;
  },

  /**
   * Calls the get variation method on the Optimizely object with attributes and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureGetVariationWithAttributes: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.getVariation('testExperimentWithFirefoxAudience', userId, {'browser_type': 'firefox'});
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'variation');
    return time;
  },

  /**
   * Calls the get variation method on the Optimizely object with a forced variation and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureGetVariationWithForcedVariation: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.getVariation('testExperiment2', userId);
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'variation');
    return time;
  },

  /**
   * Calls the get variation method on the Optimizely object with a mutually exclusive grouped experiment and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureGetVariationWithGroupedExperiment: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.getVariation('mutex_exp2', userId);
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'b');
    return time;
  },

  /**
   * Calls the get variation method on the Optimizely object with a mutually exclusive grouped experiment & attributes and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureGetVariationWithGroupedExperimentAndAttributes: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    var variationKey = optlyInstance.getVariation('mutex_exp1', userId, {'browser_type': 'chrome'});
    var end = module.exports.getTimestamp();
    var time = end - start;
    assert.strictEqual(variationKey, 'a');
    return time;
  },

  /**
   * Calls the track method on the Optimizely object and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureTrack: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEvent', userId);
    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Calls the track method on the Optimizely object with attributes and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureTrackWithAttributes: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEventWithAudiences', userId, {'browser_type': 'firefox'});
    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Calls the track method on the Optimizely object with revenue and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureTrackWithRevenue: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEvent', userId, null, 666);
    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Calls the track method on the Optimizely object with attributes & revenue and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureTrackWithAttributesAndRevenue: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEventWithAudiences', userId, {'browser_type': 'firefox'}, 666);
    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Calls the track method on the Optimizely object with a mutually exclusive grouped experiment and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureTrackWithGroupedExperiment: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEventWithMultipleGroupedExperiments', userId);

    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Calls the track method on the Optimizely object with a mutually exclusive group & attributes and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureTrackWithGroupedExperimentAndAttributes: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEventWithMultipleExperiments', userId, {'browser_type': 'chrome'});
    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Calls the track method on the Optimizely object with mutually exclusive group & revenue and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */
  measureTrackWithGroupedExperimentAndRevenue: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEventWithMultipleGroupedExperiments', userId, null, 666);
    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Calls the track method on the Optimizely object with mutually exclusive group, attributes, & revenue and measures how long it takes
   * @param  {Object} datafile
   * @param  {string} userId
   * @return {Number} ms to execute
   */

  measureTrackWithGroupedExperimentAndAttributesAndRevenue: function(datafile, userId) {
    var optlyInstance = module.exports.createOptimizelyInstance(datafile);
    var start = module.exports.getTimestamp();
    optlyInstance.track('testEventWithMultipleExperiments', userId, {'browser_type': 'chrome'}, 666);
    var end = module.exports.getTimestamp();
    var time = end - start;
    return time;
  },

  /**
   * Creates an Optimizely instance for all API method profiling
   * @param  {Object} datafile
   * @return {Object} Optimizely instance
   */
  createOptimizelyInstance: function(datafile) {
    return Optimizely.createInstance({
      datafile: datafile,
      eventDispatcher: {dispatchEvent: function() { return bluebird.resolve(null); }},
      logger: {log: function() {}},
      errorHandler: {handleError: function() {}},
      skipJSONValidation: true,
    });
  },

  /**
   * Returns Date.now(), how fun is that?
   * @return {number} time
   */
  getTimestamp: function() {
    return Date.now();
  },

  /**
   * Finds and logs medians, asserts if medians hit SLAs
   * @param times
   * @param slaTime
   * @param numOfExperiments
   */
  validateMedian: function(times, slaTime, numOfExperiments) {
    var median = math.median(times);
    console.log('Median time for ' + numOfExperiments + ' experiments is: ' + median);
    assert.isBelow(median, slaTime);
  },

  /**
   * Finds and logs averages, asserts if averages hit SLAs
   * @param times
   * @param slaTime
   * @param numOfExperiments
   */
  validateAverage: function(times, slaTime, numOfExperiments) {
    var average = math.mean(times);
    console.log('80% average time for ' + numOfExperiments + ' experiments is: ' + average);
    assert.isBelow(average, slaTime);
  },

  /**
   * Removes max and min times of 10-iteration sets for finding 80% average
   * @param times
   */
  removeMaxAndMin: function(times) {
    times.splice(times.indexOf(Math.max.apply(null, times)), 1);
    times.splice(times.indexOf(Math.min.apply(null, times)), 1);
  },
};
