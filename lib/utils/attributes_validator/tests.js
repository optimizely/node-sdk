var chai = require('chai');
var assert = chai.assert;
var sprintf = require('sprintf');
var attributesValidator = require('./');

var ERROR_MESSAGES = require('../enums').ERROR_MESSAGES;

describe('lib/utils/attributes_validator', function() {
  describe('APIs', function() {
    describe('validate', function() {
      it('should validate the given attributes if attributes is an object', function() {
        assert.isTrue(attributesValidator.validate({testAttribute: 'testValue'}));
      });

      it('should throw an error if attributes is an array', function() {
        var attributesArray = ['notGonnaWork'];
        assert.throws(function() {
          attributesValidator.validate(attributesArray);
        }, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));
      });

      it('should throw an error if attributes is null', function() {
        assert.throws(function() {
          attributesValidator.validate(null);
        }, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));
      });

      it('should throw an error if attributes is a function', function() {
        function invalidInput() {
          console.log('This is an invalid input!');
        }
        assert.throws(function() {
          attributesValidator.validate(invalidInput);
        }, sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, 'ATTRIBUTES_VALIDATOR'));
      });
    });
  });
});
