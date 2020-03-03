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

      context('When the next token is an expression', function() {
        let exampleStrings = [
          "1 === 1, 34, true",
          "2 * 5, null, false",
          "'a' + 'b', [{a: 1}, {b: 2}], 'test', 23",
          "true || false, [{a: 1}, {b: 2}], 'test', 23",
          "x + y, [{a: 1}, {b: 2}], 'test', 23",
          "[1, 2, 3].length > [4, 5].length, [{a: 1}, {b: 2}]"
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          let expectedResults = [
            "1 === 1",
            "2 * 5",
            "'a' + 'b'",
            "true || false",
            "x + y",
            "[1, 2, 3].length > [4, 5].length"
          ];
          exampleStrings.forEach((str, i) => assert.equal(expectedResults[i], results[i].token));
        });
        it('specifies the token type as "expression"', function() {
          results.forEach(result => assert.equal('expression', result.tokenType));
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
          results.forEach(result => assert.equal('string', result.tokenType));
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
          results.forEach(result => assert.equal('array', result.tokenType));
        });
      });

      context('When the next token is an object', function() {
        let exampleStrings = [
          "{names: ['peter', 'paul', 'mary'], petNames: ['fido', 'bubastis', 'scooby-doo']}, 'fifteen', 34",
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
          results.forEach(result => assert.equal('object', result.tokenType));
        });
      });

      context('When the next token is a null value', function() {
        let exampleStrings = [
          "null, [null, true, false], 'fifteen', 34",
          "null, 23, {a: 1, b: 2}",
          "null, [1, 2, 3], 'test'"
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "nullval"', function() {
          assert.true(results.every(result => result.tokenType === 'nullval'));
        });
      });

      context('When the next token is a boolean', function() {
        let exampleStrings = [
          "false, [null, true, false], 'fifteen', 34",
          "true, [null, true, false], 'fifteen', 34"
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "boolean"', function() {
          assert.true(results.every(result => result.tokenType === 'boolean'));
        });
      });

      context('When the next token is a number', function() {
        let exampleStrings = [
          "19, [null, true, false], 'fifteen', 34",
          "1.2, null, 23, {a: 1, b: 2}",
          "-2, [1, 2, 3], 'test'",
          "0, 2, -12",
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "number"', function() {
          assert.true(results.every(result => result.tokenType === 'number'));
        });
      });

      context('When the next token is a variable name', function() {
        let exampleStrings = [
          "an, [null, true, false], 'fifteen', 34",
          "example, null, 23, {a: 1, b: 2}",
          "someVar.someProp, [1, 2, 3], 'test'",
          "ten, 2, -12",
        ];
        let results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "varName"', function() {
          assert.true(results.every(result => result.tokenType === 'varName'));
        });
      });
    });
  });
};
