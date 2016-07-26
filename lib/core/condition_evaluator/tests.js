var chai = require('chai');
var assert = chai.assert;
var conditionEvaluator = require('./');

var browserConditionSafari = {'name': 'browser_type', 'value': 'safari'};
var deviceConditionIphone = {'name': 'device_model', 'value': 'iphone6'};

describe('lib/core/condition_evaluator', function() {
  describe('APIs', function() {
    describe('evaluate', function() {
      it('should return true there is a match', function() {
        var userAttributes = {
          browser_type: 'safari',
        };

        assert.isTrue(conditionEvaluator.evaluate(['and', browserConditionSafari], userAttributes));
      });

      it('should return false when there is no match', function() {
        var userAttributes = {
          browser_type: 'firefox',
        };

        assert.isFalse(conditionEvaluator.evaluate(['and', browserConditionSafari], userAttributes));
      });

      describe('and evaluation', function() {
        it('should return true when ALL conditions evaluate to true', function() {
          var userAttributes = {
            'browser_type': 'safari',
            'device_model': 'iphone6',
          };

          assert.isTrue(conditionEvaluator.evaluate(['and', browserConditionSafari, deviceConditionIphone], userAttributes));
        });

        it('should return false if one condition evaluates to false', function() {
          var userAttributes = {
            'browser_type': 'safari',
            'device_model': 'nexus7',
          };

          assert.isFalse(conditionEvaluator.evaluate(['and', browserConditionSafari, deviceConditionIphone], userAttributes));
        });
      });

      describe('or evaluation', function() {
        it('should return true if any condition evaluates to true', function() {
          var userAttributes = {
            'browser_type': 'safari',
            'device_model': 'nexus5',
          };

          assert.isTrue(conditionEvaluator.evaluate(['or', browserConditionSafari, deviceConditionIphone], userAttributes));
        });

        it('should return false if all conditions evaluate to false', function() {
          var userAttributes = {
            'browser_type': 'chrome',
            'device_model': 'nexus6',
          };

          assert.isFalse(conditionEvaluator.evaluate(['or', browserConditionSafari, deviceConditionIphone], userAttributes));
        });
      });

      describe('not evaluation', function() {
        it('should return true if the condition evaluates to false', function() {
          var userAttributes = {
            'browser_type': 'chrome',
          };

          assert.isTrue(conditionEvaluator.evaluate(['not', browserConditionSafari], userAttributes));
        });

        it('should return false if the condition evaluates to true', function() {
          var userAttributes = {
            'device_model': 'iphone6',
          };

          assert.isFalse(conditionEvaluator.evaluate(['not', deviceConditionIphone], userAttributes));
        });
      });
    });
  });
});
