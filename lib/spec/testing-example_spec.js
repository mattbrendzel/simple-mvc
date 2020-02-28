module.exports = function() {
  const { describe, it, assert } = this;
  describe('TestingExample', function() {
    const TestingExample = require('../testing-example.js');
    describe('.exampleMethod', function() {
      it('returns 42', function() {
        assert.equal(TestingExample.exampleMethod(), 42);
      });
      it('returns a number below 50', function() {
        assert.true(TestingExample.exampleMethod() < 50);
      });
      it('returns a value', function() {
        assert.exists(TestingExample.exampleMethod());
      })
    });
  });
};
