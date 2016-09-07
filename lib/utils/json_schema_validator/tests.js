var chai = require('chai');
var assert = chai.assert;
var jsonSchemaValidator = require('./');
var projectConfigSchema = require('../../optimizely/project_config_schema');
var sprintf = require('sprintf');
var testData = require('../../../tests/test_data.js');

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

      it('should validate specified New Optimizely datafile if comparing to New Optimizely schema', function() {
        assert.isTrue(jsonSchemaValidator.validate(projectConfigSchema.V2, testData.getTestProjectConfigNewOptly()));
      });

      it('should throw an error if New Optimizely datafile is compared to Classic Optimizely schema', function() {
        assert.throws(function() {
          jsonSchemaValidator.validate(projectConfigSchema.V1, testData.getTestProjectConfigNewOptly());
        }, sprintf(ERROR_MESSAGES.INVALID_DATAFILE,
                   'JSON_SCHEMA_VALIDATOR',
                   'instance.dimensions[0] requires property "segmentId"'));
      });

      it('should validate specified Classic Optimizely datafile', function() {
        assert.isTrue(jsonSchemaValidator.validate(projectConfigSchema.V1, testData.getTestProjectConfig()));
      });

      it('should throw an error if Classic Optimizely datafile is compared to New Optimizely schema', function() {
        assert.throws(function() {
          jsonSchemaValidator.validate(projectConfigSchema.V2, testData.getTestProjectConfig());
        }, sprintf(ERROR_MESSAGES.INVALID_DATAFILE,
                   'JSON_SCHEMA_VALIDATOR',
                   'instance.groups[0].experiments[0] requires property "layerId"'));
      });
    });
  });
});
