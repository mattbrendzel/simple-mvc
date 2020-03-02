module.exports = function() {
  const { describe, context, it, assert } = this;
  describe('Parser', function() {
    const Parser = require('../parser.js');

    describe('.extractNextToken', function() {
      let exampleStrings = [
        "5, [null, true, false], 'fifteen', 34",
        "true, [null, true, false], 'fifteen', 34",
        "null, [null, true, false], 'fifteen', 34",
        "'test', [null, true, false], 'fifteen', 34",
        "[null, true, false], 'fifteen', 34",
        "{ a: 2, b: {c: 3, d: 4} }, [null, true, false], 'fifteen', 34"
      ];

      it('returns an object with keys "originalText", "token", "tokenType", and "remainingText"', function() {
        const expectedKeys = ["originalText", "remainingText", "token", "tokenType"];
        exampleStrings.forEach(exampleString => {
          assert.true(Parser.extractNextToken(exampleString) instanceof Object);
          assert.true(!(Parser.extractNextToken(exampleString) instanceof Array));
          assert.true(!(Parser.extractNextToken(exampleString) instanceof String));

          const keys = Object.keys(Parser.extractNextToken(exampleString)).sort();
          for (let i = 0; i < expectedKeys.length; i++) assert.equal(keys[i], expectedKeys[i]);
        });
      });
      it('returns the original string under the key "originalText"', function() {
        exampleStrings.forEach(exampleString => {
          assert.equal(Parser.extractNextToken(exampleString).originalText, exampleString);
        });
      });
      it('outputs the remaining string, sans the next token (as well as delineating comma and spaces), under the key "remainingText"', function() {
        exampleStrings.forEach(exampleString => {
          const output = Parser.extractNextToken(exampleString);
          assert.equal(`${output.token}, ${output.remainingText}`, exampleString);
        });
      });

      context('When the next token is a string', function() {
        let exampleStrings = [
          "'fifteen', 34, true",
          "'now, again, forever', null, false",
          "'wherefore art thou, romeo', [{a: 1}, {b: 2}], 'test', 23"
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          let expectedResults = [
            "'fifteen'",
            "'now, again, forever'",
            "'wherefore art thou, romeo'"
          ];
          exampleStrings.forEach((str, i) => assert.equal(expectedResults[i], results[i].token));
        });
        it('specifies the token type as "string"', function() {
          assert.true(results.every(result => result.tokenType === 'string'));
        });
      });

      context('When the next token is an array', function() {
        let exampleStrings = [
          "[null, true, false], 'fifteen', 34",
          "[1, 9, 17], null, false",
          "[{a: 1}, {b: 2}], 'test', 23"
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          let expectedResults = [
            "[null, true, false]",
            "[1, 9, 17]",
            "[{a: 1}, {b: 2}]"
          ];
          exampleStrings.forEach((str, i) => assert.equal(expectedResults[i], results[i].token));
        });
        it('specifies the token type as "array"', function() {
          assert.true(results.every(result => result.tokenType === 'array'));
        });
      });

      context('When the next token is an object', function() {
        let exampleStrings = [
          "{names: ['peter', 'paul', 'mary'], petNames: ['fido', 'bubastis', 'scooby-doo']} 'fifteen', 34",
          "{test: 'test', a: 23, b: [2, 3, 4]}, [1, 9, 17], null, false",
          "{nestedArray: [{a: 1}, {b: 2}], nestedObject: {c: 3, d: 4}}, 'test', 23"
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          let expectedResults = [
            "{names: ['peter', 'paul', 'mary'], petNames: ['fido', 'bubastis', 'scooby-doo']}",
            "{test: 'test', a: 23, b: [2, 3, 4]}",
            "{nestedArray: [{a: 1}, {b: 2}], nestedObject: {c: 3, d: 4}}"
          ];
          exampleStrings.forEach((str, i) => assert.equal(expectedResults[i], results[i].token));
        });
        it('specifies the token type as "object"', function() {
          assert.true(results.every(result => result.tokenType === 'object'));
        });
      });

      context('When the next token is a number, boolean, or null value', function() {
        let exampleStrings = [
          "5, [null, true, false], 'fifteen', 34",
          "true, [null, true, false], 'fifteen', 34",
          "null, [null, true, false], 'fifteen', 34"
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "basic"', function() {
          assert.true(results.every(result => result.tokenType === 'basic'));
        });
      });
    });
  });
};