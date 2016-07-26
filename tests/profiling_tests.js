var profileHelpers = require('./measure_methods');
var testData10Experiments = require('./test_data_10_experiments');
var testData25Experiments = require('./test_data_25_experiments');
var testData50Experiments = require('./test_data_50_experiments');

var ACTIVATE_SLA_TIME = 20;
var GET_VARIATION_SLA_TIME = 5;
var INSTANTIATION_SLA_TIME_WITH_VALIDATION = 200;
var INSTANTIATION_SLA_TIME_WITHOUT_VALIDATION = 25;
var ITERATIONS_PER_TEST_FILE = 10;
var TOTAL_ITERATIONS = 30;
var TRACK_SLA_TIME = 10;

describe('profiling', function() {
  this.timeout(15000);
  describe('instantiation', function() {
    it('should execute in less than 100ms', function() {
      var timesFor50Experiments = [];
      var timesFor25Experiments = [];
      var timesFor10Experiments = [];
      for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
        timesFor50Experiments.push(profileHelpers.measureInstantiation(testData50Experiments.getTestProjectConfig()));
        timesFor25Experiments.push(profileHelpers.measureInstantiation(testData25Experiments.getTestProjectConfig()));
        timesFor10Experiments.push(profileHelpers.measureInstantiation(testData10Experiments.getTestProjectConfig()));
      }

      var allTimes = {};
      allTimes['50'] = timesFor50Experiments;
      allTimes['25'] = timesFor25Experiments;
      allTimes['10'] = timesFor10Experiments;

      var times;
      for (var numOfExperiments in allTimes) {
        times = allTimes[numOfExperiments];
        profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

        // remove max and min times to calculate 80% average times
        profileHelpers.removeMaxAndMin(times);

        profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
      }
    });

    it('should execute with logger in less than 100ms', function() {
      var timesFor50Experiments = [];
      var timesFor25Experiments = [];
      var timesFor10Experiments = [];
      for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
        timesFor50Experiments.push(profileHelpers.measureInstantiationWithLogger(testData50Experiments.getTestProjectConfig()));
        timesFor25Experiments.push(profileHelpers.measureInstantiationWithLogger(testData25Experiments.getTestProjectConfig()));
        timesFor10Experiments.push(profileHelpers.measureInstantiationWithLogger(testData10Experiments.getTestProjectConfig()));
      }

      var allTimes = {};
      allTimes['50'] = timesFor50Experiments;
      allTimes['25'] = timesFor25Experiments;
      allTimes['10'] = timesFor10Experiments;

      var times;
      for (var numOfExperiments in allTimes) {
        times = allTimes[numOfExperiments];
        profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

        // remove max and min times to calculate 80% average times
        profileHelpers.removeMaxAndMin(times);

        profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
      }
    });

    it('should execute with logger and error handler in less than 100ms', function() {
      var timesFor50Experiments = [];
      var timesFor25Experiments = [];
      var timesFor10Experiments = [];
      for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
        timesFor50Experiments.push(profileHelpers.measureInstantiationWithLoggerAndErrorHandler(testData50Experiments.getTestProjectConfig()));
        timesFor25Experiments.push(profileHelpers.measureInstantiationWithLoggerAndErrorHandler(testData25Experiments.getTestProjectConfig()));
        timesFor10Experiments.push(profileHelpers.measureInstantiationWithLoggerAndErrorHandler(testData10Experiments.getTestProjectConfig()));
      }

      var allTimes = {};
      allTimes['50'] = timesFor50Experiments;
      allTimes['25'] = timesFor25Experiments;
      allTimes['10'] = timesFor10Experiments;

      var times;
      for (var numOfExperiments in allTimes) {
        times = allTimes[numOfExperiments];
        profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

        // remove max and min times to calculate 80% average times
        profileHelpers.removeMaxAndMin(times);

        profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
      }
    });

    it('should execute without schema validation in less than 25ms', function() {
      var timesFor50Experiments = [];
      var timesFor25Experiments = [];
      var timesFor10Experiments = [];
      for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
        timesFor50Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidation(testData50Experiments.getTestProjectConfig()));
        timesFor25Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidation(testData25Experiments.getTestProjectConfig()));
        timesFor10Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidation(testData10Experiments.getTestProjectConfig()));
      }

      var allTimes = {};
      allTimes['50'] = timesFor50Experiments;
      allTimes['25'] = timesFor25Experiments;
      allTimes['10'] = timesFor10Experiments;

      var times;
      for (var numOfExperiments in allTimes) {
        times = allTimes[numOfExperiments];
        profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

        // remove max and min times to calculate 80% average times
        profileHelpers.removeMaxAndMin(times);

        profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
      }
    });

    it('should execute without schema validation and with logger in less than 25ms', function() {
      var timesFor50Experiments = [];
      var timesFor25Experiments = [];
      var timesFor10Experiments = [];
      for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
        timesFor50Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithLogger(testData50Experiments.getTestProjectConfig()));
        timesFor25Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithLogger(testData25Experiments.getTestProjectConfig()));
        timesFor10Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithLogger(testData10Experiments.getTestProjectConfig()));
      }

      var allTimes = {};
      allTimes['50'] = timesFor50Experiments;
      allTimes['25'] = timesFor25Experiments;
      allTimes['10'] = timesFor10Experiments;

      var times;
      for (var numOfExperiments in allTimes) {
        times = allTimes[numOfExperiments];
        profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

        // remove max and min times to calculate 80% average times
        profileHelpers.removeMaxAndMin(times);

        profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
      }
    });

    it('should execute without schema validation and with error handler in less than 25ms', function() {
      var timesFor50Experiments = [];
      var timesFor25Experiments = [];
      var timesFor10Experiments = [];
      for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
        timesFor50Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithErrorHandler(testData50Experiments.getTestProjectConfig()));
        timesFor25Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithErrorHandler(testData25Experiments.getTestProjectConfig()));
        timesFor10Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithErrorHandler(testData10Experiments.getTestProjectConfig()));
      }

      var allTimes = {};
      allTimes['50'] = timesFor50Experiments;
      allTimes['25'] = timesFor25Experiments;
      allTimes['10'] = timesFor10Experiments;

      var times;
      for (var numOfExperiments in allTimes) {
        times = allTimes[numOfExperiments];
        profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

        // remove max and min times to calculate 80% average times
        profileHelpers.removeMaxAndMin(times);

        profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
      }
    });

    it('should execute without schema validation and with logger & error handler in less than 25ms', function() {
      var timesFor50Experiments = [];
      var timesFor25Experiments = [];
      var timesFor10Experiments = [];
      for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
        timesFor50Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithLoggerAndErrorHandler(testData50Experiments.getTestProjectConfig()));
        timesFor25Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithLoggerAndErrorHandler(testData25Experiments.getTestProjectConfig()));
        timesFor10Experiments.push(profileHelpers.measureInstantiationWithoutJSONValidationAndWithLoggerAndErrorHandler(testData10Experiments.getTestProjectConfig()));
      }

      var allTimes = {};
      allTimes['50'] = timesFor50Experiments;
      allTimes['25'] = timesFor25Experiments;
      allTimes['10'] = timesFor10Experiments;

      var times;
      for (var numOfExperiments in allTimes) {
        times = allTimes[numOfExperiments];
        profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

        // remove max and min times to calculate 80% average times
        profileHelpers.removeMaxAndMin(times);

        profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
      }
    });
  });

  describe('APIs', function() {
    describe('activate', function() {
      it('should execute activate in less than 20ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureActivate(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureActivate(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureActivate(testData10Experiments.getTestProjectConfig(), 'test'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute activate with attributes in less than 20ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureActivateWithAttributes(testData50Experiments.getTestProjectConfig(), 'test'));
          timesFor25Experiments.push(profileHelpers.measureActivateWithAttributes(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureActivateWithAttributes(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute activate with forced variation in less than 20ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureActivateWithForcedVariation(testData50Experiments.getTestProjectConfig(), 'variation_user'));
          timesFor25Experiments.push(profileHelpers.measureActivateWithForcedVariation(testData25Experiments.getTestProjectConfig(), 'variation_user'));
          timesFor10Experiments.push(profileHelpers.measureActivateWithForcedVariation(testData10Experiments.getTestProjectConfig(), 'variation_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute activate with grouped experiment in less than 20ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureActivateWithGroupedExperiment(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureActivateWithGroupedExperiment(testData25Experiments.getTestProjectConfig(), 'test'));
          timesFor10Experiments.push(profileHelpers.measureActivateWithGroupedExperiment(testData10Experiments.getTestProjectConfig(), 'no'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute activate with grouped experiment and attributes in less than 20ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureActivateWithGroupedExperimentAndAttributes(testData50Experiments.getTestProjectConfig(), 'test'));
          timesFor25Experiments.push(profileHelpers.measureActivateWithGroupedExperimentAndAttributes(testData25Experiments.getTestProjectConfig(), 'yes'));
          timesFor10Experiments.push(profileHelpers.measureActivateWithGroupedExperimentAndAttributes(testData10Experiments.getTestProjectConfig(), 'test'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });
    });

    describe('getVariation', function() {
      it('should execute getVariation in less than 5ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureGetVariation(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureGetVariation(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureGetVariation(testData10Experiments.getTestProjectConfig(), 'test'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute getVariation with attributes in less than 5ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureGetVariationWithAttributes(testData50Experiments.getTestProjectConfig(), 'test'));
          timesFor25Experiments.push(profileHelpers.measureGetVariationWithAttributes(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureGetVariationWithAttributes(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute getVariation with forced variation in less than 5ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureGetVariationWithForcedVariation(testData50Experiments.getTestProjectConfig(), 'variation_user'));
          timesFor25Experiments.push(profileHelpers.measureGetVariationWithForcedVariation(testData25Experiments.getTestProjectConfig(), 'variation_user'));
          timesFor10Experiments.push(profileHelpers.measureGetVariationWithForcedVariation(testData10Experiments.getTestProjectConfig(), 'variation_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute getVariation with grouped experiment in less than 5ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureGetVariationWithGroupedExperiment(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureGetVariationWithGroupedExperiment(testData25Experiments.getTestProjectConfig(), 'test'));
          timesFor10Experiments.push(profileHelpers.measureGetVariationWithGroupedExperiment(testData10Experiments.getTestProjectConfig(), 'no'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute getVariation with grouped experiment and attributes in less than 5ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureGetVariationWithGroupedExperimentAndAttributes(testData50Experiments.getTestProjectConfig(), 'test'));
          timesFor25Experiments.push(profileHelpers.measureGetVariationWithGroupedExperimentAndAttributes(testData25Experiments.getTestProjectConfig(), 'yes'));
          timesFor10Experiments.push(profileHelpers.measureGetVariationWithGroupedExperimentAndAttributes(testData10Experiments.getTestProjectConfig(), 'test'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });
    });

    describe('track', function() {
      it('should execute track in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrack(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureTrack(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureTrack(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute track with attributes in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrackWithAttributes(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureTrackWithAttributes(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureTrackWithAttributes(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute track with revenue in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrackWithRevenue(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureTrackWithRevenue(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureTrackWithRevenue(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute track with attributes and revenue in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrackWithAttributesAndRevenue(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureTrackWithAttributesAndRevenue(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureTrackWithAttributesAndRevenue(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute track with grouped experiment in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrackWithGroupedExperiment(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureTrackWithGroupedExperiment(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureTrackWithGroupedExperiment(testData10Experiments.getTestProjectConfig(), 'no'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute track with grouped experiment and attributes in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndAttributes(testData50Experiments.getTestProjectConfig(), 'test'));
          timesFor25Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndAttributes(testData25Experiments.getTestProjectConfig(), 'yes'));
          timesFor10Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndAttributes(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute track with grouped experiment and revenue in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndRevenue(testData50Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor25Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndRevenue(testData25Experiments.getTestProjectConfig(), 'optimizely_user'));
          timesFor10Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndRevenue(testData10Experiments.getTestProjectConfig(), 'no'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });

      it('should execute track with grouped experiment, attributes, and revenue in less than 3ms', function() {
        var timesFor50Experiments = [];
        var timesFor25Experiments = [];
        var timesFor10Experiments = [];
        for (var i = 0; i < ITERATIONS_PER_TEST_FILE; i++) {
          timesFor50Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndAttributesAndRevenue(testData50Experiments.getTestProjectConfig(), 'test'));
          timesFor25Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndAttributesAndRevenue(testData25Experiments.getTestProjectConfig(), 'yes'));
          timesFor10Experiments.push(profileHelpers.measureTrackWithGroupedExperimentAndAttributesAndRevenue(testData10Experiments.getTestProjectConfig(), 'optimizely_user'));
        }

        var allTimes = {};
        allTimes['50'] = timesFor50Experiments;
        allTimes['25'] = timesFor25Experiments;
        allTimes['10'] = timesFor10Experiments;

        var times;
        for (var numOfExperiments in allTimes) {
          times = allTimes[numOfExperiments];
          profileHelpers.validateMedian(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);

          // remove max and min times to calculate 80% average times
          profileHelpers.removeMaxAndMin(times);

          profileHelpers.validateAverage(times, INSTANTIATION_SLA_TIME_WITH_VALIDATION, numOfExperiments);
        }
      });
    });
  });
});
