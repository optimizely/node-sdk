var audienceEvaluator = require('./');
var chai = require('chai');
var assert = chai.assert;

var chromeUserAudience = {
  conditions: ['and', {'name': 'browser_type', 'value': 'chrome'}],
};
var iphoneUserAudience = {
  conditions: ['and', {'name': 'device_model', 'value': 'iphone'}],
};

describe('lib/core/audience_evaluator', function() {
  describe('APIs', function() {
    describe('evaluate', function() {
      it('should return true if there are no audiences', function() {
        assert.isTrue(audienceEvaluator.evaluate([], {}));
      });

      it('should return false if there are audiences but no attributes', function() {
        assert.isFalse(audienceEvaluator.evaluate([chromeUserAudience], {}));
      });

      it('should return true if any of the audience conditions are met', function() {
        var iphoneUsers = {
          'device_model': 'iphone',
        };

        var chromeUsers = {
          'browser_type': 'chrome',
        };

        var iphoneChromeUsers = {
          'browser_type': 'chrome',
          'device_model': 'iphone',
        };

        assert.isTrue(audienceEvaluator.evaluate([chromeUserAudience, iphoneUserAudience], iphoneUsers));
        assert.isTrue(audienceEvaluator.evaluate([chromeUserAudience, iphoneUserAudience], chromeUsers));
        assert.isTrue(audienceEvaluator.evaluate([chromeUserAudience, iphoneUserAudience], iphoneChromeUsers));
      });

      it('should return false if none of the audience conditions are met', function() {
        var nexusUsers = {
          'device_model': 'nexus5',
        };

        var safariUsers = {
          'browser_type': 'safari',
        };

        var nexusSafariUsers = {
          'browser_type': 'safari',
          'device_model': 'nexus5',
        };

        assert.isFalse(audienceEvaluator.evaluate([chromeUserAudience, iphoneUserAudience], nexusUsers));
        assert.isFalse(audienceEvaluator.evaluate([chromeUserAudience, iphoneUserAudience], safariUsers));
        assert.isFalse(audienceEvaluator.evaluate([chromeUserAudience, iphoneUserAudience], nexusSafariUsers));
      });
    });
  });
});
