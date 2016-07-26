var _ = require('lodash/core');
var validate = require('jsonschema').validate;
var sprintf = require('sprintf');

var ERROR_MESSAGES = require('../enums').ERROR_MESSAGES;
var MODULE_NAME = 'JSON_SCHEMA_VALIDATOR';

module.exports = {
  /**
   * Validate the given json object against the specified schema
   * @param  {Object} jsonSchema The json schema to validate against
   * @param  {Object} jsonObject The object to validate against the schema
   * @return {Boolean}           True if the given object is valid
   */
  validate: function(jsonSchema, jsonObject) {
    if (!jsonSchema) {
      throw new Error(sprintf(ERROR_MESSAGES.JSON_SCHEMA_EXPECTED, MODULE_NAME));
    }

    if (!jsonObject) {
      throw new Error(sprintf(ERROR_MESSAGES.NO_JSON_PROVIDED, MODULE_NAME));
    }

    var result = validate(jsonObject, jsonSchema);

    if (result.valid) {
      return true;
    } else {
      if (_.isArray(result.errors)) {
        throw new Error(sprintf(ERROR_MESSAGES.INVALID_DATAFILE, MODULE_NAME, result.errors[0].stack));
      }
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_JSON, MODULE_NAME));
    }
  }
};
