var chai = require('chai');
var assert = chai.assert;
var userIdValidator = require('./');
var enums = require('../enums');
var sprintf = require('sprintf');

var ERROR_MESSAGES = enums.ERROR_MESSAGES;

describe('lib/utils/user_id_validator', function() {
  describe('APIs', function() {
    describe('validate', function() {
      it('should validate the given userId if userId is a valid string', function() {
        assert.isTrue(userIdValidator.validate('validUserId'));
      });

      it('should throw an error if userId is null', function() {
        assert.throws(function() {
          userIdValidator.validate(null);
        }, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));
      });

      it('should throw an error if userId is undefined', function() {
        assert.throws(function() {
          userIdValidator.validate(undefined);
        }, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));
      });

      it('should throw an error if userId is an empty string', function() {
        assert.throws(function() {
          userIdValidator.validate('');
        }, sprintf(ERROR_MESSAGES.INVALID_USER_ID, 'USER_ID_VALIDATOR'));
      });
    });
  });
});
