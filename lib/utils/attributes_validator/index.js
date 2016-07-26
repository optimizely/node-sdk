/**
 * Provides utility method for validating that the attributes user has provided are valid
 */

var sprintf = require('sprintf');

var ERROR_MESSAGES = require('../enums').ERROR_MESSAGES;
var MODULE_NAME = 'ATTRIBUTES_VALIDATOR';

module.exports = {
  /**
   * Validates user's provided attributes
   * @param  {Object}  attributes
   * @return {boolean} True if the attributes are valid
   * @throws If the attributes are not valid
   */
  validate: function(attributes) {
    if (typeof attributes === 'object' && !Array.isArray(attributes) && attributes !== null) {
      return true;
    } else {
      throw new Error(sprintf(ERROR_MESSAGES.INVALID_ATTRIBUTES, MODULE_NAME));
    }
  },
};
