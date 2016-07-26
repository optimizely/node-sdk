var chai = require('chai');
var assert = chai.assert;
var jsonSchemaValidator = require('./');
var sprintf = require('sprintf');

var ERROR_MESSAGES = require('../enums').ERROR_MESSAGES;

describe('lib/utils/json_schema_validator', function() {
  describe('APIs', function() {
    describe('validate', function() {
      it('should validate the given object against the specified schema', function() {
        assert.isTrue(jsonSchemaValidator.validate({'type': 'number'}, 4));
      });

      it('should throw an error if the object is not valid', function() {
        assert.throws(function() {
          jsonSchemaValidator.validate({'type': 'number'}, 'not a number');
        }, sprintf(ERROR_MESSAGES.INVALID_DATAFILE, 'JSON_SCHEMA_VALIDATOR', 'instance is not of a type(s) number'));
      });

      it('should throw an error if no schema is passed in', function() {
        assert.throws(function() {
          jsonSchemaValidator.validate();
        }, sprintf(ERROR_MESSAGES.JSON_SCHEMA_EXPECTED, 'JSON_SCHEMA_VALIDATOR'));
      });

      it('should throw an error if no json object is passed in', function() {
        assert.throws(function() {
          jsonSchemaValidator.validate({'type': 'number'});
        }, sprintf(ERROR_MESSAGES.NO_JSON_PROVIDED, 'JSON_SCHEMA_VALIDATOR'));
      });
    });
  });
});
