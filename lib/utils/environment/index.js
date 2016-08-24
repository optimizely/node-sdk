module.exports = {
  /**
   * Determines if the code is executing in a node environment
   * @return {Boolean} true if the code is running in a node env
   */
  isNode: function() {
    return typeof window === 'undefined'
      && typeof process === 'object';
  },
};
