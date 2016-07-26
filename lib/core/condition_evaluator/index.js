var AND_CONDITION = 'and';
var OR_CONDITION = 'or';
var NOT_CONDITION = 'not';

var DEFAULT_OPERATOR_TYPES = [AND_CONDITION, OR_CONDITION, NOT_CONDITION];

/**
 * Top level method to evaluate audience conditions
 * @param  {Object[]} conditions     Nested array of and/or conditions.
 *                                   Example: ['and', operand_1, ['or', operand_2, operand_3]]
 * @param  {Object}   userAttributes Hash representing user attributes which will be used in determining if
 *                                   the audience conditions are met.
 * @return {Boolean}  true if the given user attributes match the given conditions
 */
function evaluate(conditions, userAttributes) {
  if (Array.isArray(conditions)) {
    var firstOperator = conditions[0];

    // return false for invalid operators
    if (DEFAULT_OPERATOR_TYPES.indexOf(firstOperator) === -1) {
      return false;
    }

    var restOfConditions = conditions.slice(1);
    switch (firstOperator) {
      case AND_CONDITION:
        return andEvaluator(restOfConditions, userAttributes);
      case NOT_CONDITION:
        return notEvaluator(restOfConditions, userAttributes);
      case OR_CONDITION:
        return orEvaluator(restOfConditions, userAttributes);
    }
  }

  var deserializedConditions = [conditions.name, conditions.value];
  return evaluator(deserializedConditions, userAttributes);
}

/**
 * Evaluates an array of conditions as if the evaluator had been applied
 * to each entry and the results AND-ed together.
 * @param  {Object[]} conditions     Array of conditions ex: [operand_1, operand_2]
 * @param  {Object}   userAttributes Hash representing user attributes
 * @return {Boolean}                 true if the user attributes match the given conditions
 */
function andEvaluator(conditions, userAttributes) {
  var result = true;
  var condition;
  for (var i = 0; i < conditions.length; i++) {
    condition = conditions[i];
    if (!evaluate(condition, userAttributes)) {
      result = false;
      break;
    }
  }

  return result;
}

/**
 * Evaluates an array of conditions as if the evaluator had been applied
 * to a single entry and NOT was applied to the result.
 * @param  {Object[]} conditions     Array of conditions ex: [operand_1, operand_2]
 * @param  {Object}   userAttributes Hash representing user attributes
 * @return {Boolean}                 true if the user attributes match the given conditions
 */
function notEvaluator(conditions, userAttributes) {
  if (conditions.length !== 1) {
    return false;
  }

  return !evaluate(conditions[0], userAttributes);
}

/**
 * Evaluates an array of conditions as if the evaluator had been applied
 * to each entry and the results OR-ed together.
 * @param  {Object[]} conditions     Array of conditions ex: [operand_1, operand_2]
 * @param  {Object}   userAttributes Hash representing user attributes
 * @return {Boolean}                 true if the user attributes match the given conditions
 */
function orEvaluator(conditions, userAttributes) {
  var result = false;
  for (var i = 0; i < conditions.length; i++) {
    var condition = conditions[i];
    if (evaluate(condition, userAttributes)) {
      result = true;
      break;
    }
  }

  return result;
}

/**
 * Evaluates an array of conditions as if the evaluator had been applied
 * to a single entry and NOT was applied to the result.
 * @param  {Object[]} conditions     Array of a single condition ex: [operand_1]
 * @param  {Object}   userAttributes Hash representing user attributes
 * @return {Boolean}                 true if the user attributes match the given conditions
 */
function evaluator(conditions, userAttributes) {
  if (userAttributes.hasOwnProperty(conditions[0])) {
    return userAttributes[conditions[0]] === conditions[1];
  }

  return false;
}

module.exports = {
  evaluate: evaluate,
};
