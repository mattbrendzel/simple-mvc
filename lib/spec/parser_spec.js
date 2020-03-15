module.exports = function() {
  const { describe, xdescribe, context, xcontext, it, assert } = this;
  describe('Parser', function() {
    const Parser = require('../parser.js');

    describe('.extractNextToken', function() {
      const exampleStrings = [
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
        const exampleStrings = [
          "1 === 1, 34, true",
          "2 * 5, null, false",
          "'a' + 'b', [{a: 1}, {b: 2}], 'test', 23",
          "true || false, [{a: 1}, {b: 2}], 'test', 23",
          "x + y, [{a: 1}, {b: 2}], 'test', 23",
          "[1, 2, 3].length > [4, 5].length, [{a: 1}, {b: 2}]",
          "someFunc(23), 5"
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          const expectedResults = [
            "1 === 1",
            "2 * 5",
            "'a' + 'b'",
            "true || false",
            "x + y",
            "[1, 2, 3].length > [4, 5].length",
            "someFunc(23)"
          ];
          exampleStrings.forEach((str, i) => assert.equal(expectedResults[i], results[i].token));
        });
        it('specifies the token type as "expression"', function() {
          results.forEach(result => assert.equal('expression', result.tokenType));
        });
      });

      context('When the next token is a string', function() {
        const exampleStrings = [
          "'fifteen', 34, true",
          "'now, again, forever', null, false",
          "'wherefore art thou, romeo', [{a: 1}, {b: 2}], 'test', 23"
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          const expectedResults = [
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
        const exampleStrings = [
          "[null, true, false], 'fifteen', 34",
          "[1, 9, 17], null, false",
          "[{a: 1}, {b: 2}], 'test', 23"
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          const expectedResults = [
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
        const exampleStrings = [
          "{names: ['peter', 'paul', 'mary'], petNames: ['fido', 'bubastis', 'scooby-doo']}, 'fifteen', 34",
          "{test: 'test', a: 23, b: [2, 3, 4]}, [1, 9, 17], null, false",
          "{nestedArray: [{a: 1}, {b: 2}], nestedObject: {c: 3, d: 4}}, 'test', 23"
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          const expectedResults = [
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
        const exampleStrings = [
          "null, [null, true, false], 'fifteen', 34",
          "null, 23, {a: 1, b: 2}",
          "null, [1, 2, 3], 'test'"
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "nullval"', function() {
          assert.true(results.every(result => result.tokenType === 'nullval'));
        });
      });

      context('When the next token is a boolean', function() {
        const exampleStrings = [
          "false, [null, true, false], 'fifteen', 34",
          "true, [null, true, false], 'fifteen', 34"
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "boolean"', function() {
          assert.true(results.every(result => result.tokenType === 'boolean'));
        });
      });

      context('When the next token is a number', function() {
        const exampleStrings = [
          "19, [null, true, false], 'fifteen', 34",
          "1.2, null, 23, {a: 1, b: 2}",
          "-2, [1, 2, 3], 'test'",
          "0, 2, -12",
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "number"', function() {
          assert.true(results.every(result => result.tokenType === 'number'));
        });
      });

      context('When the next token is a variable name', function() {
        const exampleStrings = [
          "an, [null, true, false], 'fifteen', 34",
          "example, null, 23, {a: 1, b: 2}",
          "someVar.someProp, [1, 2, 3], 'test'",
          "ten, 2, -12",
        ];
        const results = exampleStrings.map(str => Parser.extractNextToken(str));

        it('returns the next token under the key "token"', function() {
          exampleStrings.forEach((str, i) => assert.equal(str.split(",")[0], results[i].token));
        });
        it('specifies the token type as "varName"', function() {
          assert.true(results.every(result => result.tokenType === 'varName'));
        });
      });
    });

    describe('.parseToken', function() {
      const exampleTokens = [
        "null",
        "true",
        "23",
        "'test string'",
        "[4, 67, 3, 99]",
        "{a: 1, b: 2}",
        "obj.someProp",
        // "obj.someMethod(9)",
        // "'hello' + ' ' + 'world'"
      ];
      const exampleContext = {
        obj: { someProp: 9001, someMethod: function(x) { return x + 5; } }
      };

      context('when the token is of type "nullval" (i.e. a null)', function() {
        it('returns null', function() {
          assert.equal(null, Parser.parseToken('nullval', 'null'));
        });
      });

      context('when the token is of type "boolean"', function() {
        it('returns the appropriate boolean value', function() {
          assert.equal(true, Parser.parseToken('true'));
          assert.equal(false, Parser.parseToken('false'));
        });
      });

      context('when the token is of type "number"', function() {
        it('returns the appropriate number value', function() {
          const exampleTokens = Array.from({length: 40}, () => (Math.floor(Math.random()*40)*0.25).toString());
          const expectedResults = exampleTokens.map(token => Number(token));
          exampleTokens.forEach((token, i) => {
            assert.equal(expectedResults[i], Parser.parseToken(token))
          });
        });
      });

      context('when the token is of type "string"', function() {
        it('returns the appropriate string value', function() {
          const exampleTokens = Array.from({length: 40}, () => {
            return `"${Array.from({length: 12}, () => String.fromCharCode(94 + Math.floor(Math.random() * 26))).join('')}"`;
          });
          const expectedResults = exampleTokens.map(token => token.slice(1, -1));
          exampleTokens.forEach((token, i) => {
            assert.equal(expectedResults[i], Parser.parseToken(token))
          });
        });
      });

      context('when the token is of type "varName"', function() {
        const exampleContext = {a: 1, b: 2, c: {d: 4, e: { f: 9 }}};
        context('when the variable name exists in the context object', function() {
          const exampleTokens = ['a','b', 'c.d', 'c.e.f'];
          it('returns the value of the named variable', function() {
            const expectedResults = [1, 2, 4, 9];
            exampleTokens.forEach((token, i) => {
              assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
            });
          });
        });
        context('when the variable name does not exist in the context object', function() {
          const exampleTokens = ['g', 'h', 'i', 'j', 'k', 'c.e.f.l'];
          it('returns undefined', function() {
            exampleTokens.forEach((token, i) => {
              assert.equal('undefined', typeof Parser.parseToken('varName', token, context));
            });
          });
        });
      });

      context('when the token is of type "array"', function() {
        const exampleTokens = [
          '[1, 2, 3]',
          '[[1], [2], [3]]',
          '["test", "strings"]',
          '[null, true, false]',
          '[a, b.c]'
        ];
        const exampleContext = { a: 88, b: { c: 77 } }
        const expectedResults = [
          [1, 2, 3],
          [[1], [2], [3]],
          ["test", "strings"],
          [null, true, false],
          [88, 77]
        ];
        it('parses each individual element and returns an array of each (parsed) element', function() {
          exampleTokens.forEach((token, i) => {
            assert.deepEqual(expectedResults[i], Parser.parseToken(token, exampleContext));
          });
        });
      });

      context('when the token is of type "object"', function() {
        const exampleTokens = [
          '{a: 1, b: 2, c: 3}',
          '{a: {b: 1}, c: {d: 2}, e: {f: 3}}',
          '{a: "test", b: "strings"}',
          '{x: null, y: true, z: false}',
          '{l: a, m: b.c}'
        ];
        const exampleContext = { a: 88, b: { c: 77 } }
        const expectedResults = [
          {a: 1, b: 2, c: 3},
          {a: {b: 1}, c: {d: 2}, e: {f: 3}},
          {a: "test", b: "strings"},
          {x: null, y: true, z: false},
          {l: 88, m: 77}
        ];
        it('parses out each individual key value pair and returns an object with all keys and (parsed) values', function() {
          exampleTokens.forEach((token, i) => {
            assert.deepEqual(expectedResults[i], Parser.parseToken(token, exampleContext));
          });
        });
      });

      context('when the token is of type "expression"', function() {
        context('when the expression contains no functions or parentheses', function() {
          context('when the expression contains only one operator', function() {
            context('when the operator is an arithmatic operator', function() {
              const exampleTokens = [
                '23 + 49',
                '99 - 100',
                '-1 * 5',
                '45 / -15',
                '9 % 2'
              ];
              const exampleContext = { someObj: { someMethod: x => x + 5 } }
              const expectedResults = [
                72, //'23 + 49'
                -1, //'99 - 100',
                -5, //'-1 * 5',
                -3, //45 / -15',
                1 //'9 % 2',
              ];

              it('parses out and evaluates each arithmatic expression', function() {
                exampleTokens.forEach((token, i) => {
                  assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
                });
              });
            });
            context('when the operator is a comparison operator', function() {
              const exampleTokens = [
                '19 < 25',
                '90 < 33',
                '25 > 3',
                '25 < 3',
                '30 >= 20',
                '20 >= 20',
                '10 >= 20',
                '10 <= 20',
                '10 <= 10',
                '10 <= 0',
                '10 === 10',
                '10 !== 10',
                '10 == 10',
                '10 != 10'
              ];
              const exampleContext = { someObj: { someMethod: x => x + 5 } }
              const expectedResults = [
                true, //'19 < 25',
                false, //'90 < 33',
                true, //'25 > 3',
                false, //'25 < 3',
                true, //'30 >= 20',
                true, //'20 >= 20',
                false, //'10 >= 20',
                true, //'10 <= 20',
                true, //'10 <= 10',
                false, //'10 <= 0',
                true, //'10 === 10',
                false,//'10 !== 10',
                true, //'10 == 10',
                false,//'10 != 10'
              ];

              it('parses out and evaluates each comparison expression', function() {
                exampleTokens.forEach((token, i) => {
                  assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
                });
              });
            });
            context('when the operator is a logical operator', function() {
              const exampleTokens = [
                'true && true',
                'true && false',
                'false && false',
                'true || true',
                'true || false',
                'false || false',
                '!false',
                '!true'
              ];
              const exampleContext = { someObj: { someMethod: x => x + 5 } }
              const expectedResults = [
                true, //'true && true',
                false, //'true && false',
                false, //'false && false'
                true, //'true || true',
                true, //'true || false',
                false, //'false || false',
                true, //'!false',
                false //'!true'
              ];

              it('parses out and evaluates each expression', function() {
                exampleTokens.forEach((token, i) => {
                  assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
                });
              });
            });
          });
          context('when the expression contains multiple operators', function () {
            context('when the operators are all arithmatic', function() {
              const exampleTokens = [
                '23 + 49 + 5',
                '99 - 100 - 2',
                '-1 * 5 * 9',
                '45 / -15 / 3',
                '9 % 2 % 1',
                '2 + 3 * 5',
                '9 - 3 * 1',
                '25 * 3 / 5',
                '10 / 5 - 2',
                '20 % 3 - 1'
              ];
              const exampleContext = { someObj: { someMethod: x => x + 5 } }
              const expectedResults = [
                77, // '23 + 49 + 5',
                -3, // '99 - 100 - 2',
                -45, // '-1 * 5 * 9',
                -1, // '45 / -15 / 3',
                0, // '9 % 2 % 1',
                17, // '2 + 3 * 5',
                6, // '9 - 3 * 1',
                15, // '25 * 3 / 5',
                0, // '10 / 5 - 2',
                1 // '20 % 3 - 1'
              ];

              it('evaluates the expression, starting with *, /, and % (LtR), and then ending with + and - (LtR)', function() {
                exampleTokens.forEach((token, i) => {
                  assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
                });
              });
            });
            context('when the operators are all comparison', function() {
              const exampleTokens = [
                '19 < 25 === true',
                '90 < 33 === true',
                '25 > 3 !== false',
                '25 < 3 !== false',
                '30 >= 20 === true',
                '20 >= 20 !== false',
                '10 >= 20 === true',
                '10 <= 20 !== false',
                '10 <= 10 === true',
                '10 <= 0 !== false',
                '10 === 10 === true',
                '10 !== 10 !== false',
                '10 == 10 === true',
                '10 != 10 !== false'
              ];
              const exampleContext = { someObj: { someMethod: x => x + 5 } }
              const expectedResults = [
                true, //'19 < 25 === true',
                false, //'90 < 33 === true',
                true, //'25 > 3 !== false',
                false, //'25 < 3 !== false',
                true, //'30 >= 20 === true',
                true, //'20 >= 20 !== false',
                false, //'10 >= 20 === true',
                true, //'10 <= 20 !== false',
                true, //'10 <= 10 === true',
                false, //'10 <= 0 !== false',
                true, //'10 === 10 === true',
                false,//'10 !== 10 !== false',
                true, //'10 == 10 === true',
                false //'10 != 10 !== false'
              ];

              it('evaluates the expression, starting with <, <=, >, and >= (LtR) and ending with ===. !==. ==. and != (LtR)', function() {
                exampleTokens.forEach((token, i) => {
                  assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
                });
              });
            });
            context('when the operators are all logical', function() {
              const exampleTokens = [
                'true && !false',
                'true && !true',
                '!false && true',
                '!false || true',
                'false && false || true',
                'true || true && !false',
                'false || true && !false',
                'false || false && !true'
              ];
              const exampleContext = { someObj: { someMethod: x => x + 5 } }
              const expectedResults = [
                true, // 'true && !false',
                false, // 'true && !true',
                true, // '!false && true',
                true, // '!false || true'
                true, // 'false && false || true',
                true, // 'true || true && !false',
                true, // 'false || true && !false',
                false // 'false || false && !true'
              ];

              it('evaluates the expression, starting with the NOTs, then proceeding to the ANDs, and then finally to the ORs', function() {
                exampleTokens.forEach((token, i) => {
                  assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
                });
              });
            });
            context('when the operators are a mix of different types', function() {
              const exampleTokens = [
                '10 + 30 > 20 + 5',
                '10 + 30 <= 20 + 5',
                '10 < 30 || 20 > 10',
                '10 > 30 || 20 > 10',
                '10 < 30 || 20 < 10',
                '10 > 30 || 20 < 10',
                '10 < 30 && 20 > 10',
                '10 > 30 && 20 > 10',
                '10 < 30 && 20 < 10',
                '10 > 30 && 20 < 10',
                '10 <= 30 || 20 >= 10',
                '10 >= 30 || 20 >= 10',
                '10 <= 30 || 20 <= 10',
                '10 >= 30 || 20 <= 10',
                '5 * 3 - 1 >= 10 + 4',
                '5 * 3 - 1 > 18 - 4',
                '5 * 3 - 1 >= 10 + 4 || 5 * 3 - 1 > 18 - 4',
                '5 * 3 - 1 >= 10 + 4 && 5 * 3 - 1 > 18 - 4'
              ];
              const exampleContext = { someObj: { someMethod: x => x + 5 } }
              const expectedResults = [
                true, // '10 + 30 > 20 + 5',
                false, // '10 + 30 <= 20 + 5',
                true, // '10 < 30 || 20 > 10',
                true, // '10 > 30 || 20 > 10',
                true, // '10 < 30 || 20 < 10',
                false, // '10 > 30 || 20 < 10',
                true, // '10 < 30 && 20 > 10',
                false, // '10 > 30 && 20 > 10',
                false, // '10 < 30 && 20 < 10',
                false, // '10 > 30 && 20 < 10',
                true, // '10 <= 30 || 20 >= 10',
                true, // '10 >= 30 || 20 >= 10',
                true, // '10 <= 30 || 20 <= 10',
                false, // '10 >= 30 || 20 <= 10',
                true, // '5 * 3 - 1 >= 10 + 4',
                false, // '5 * 3 - 1 > 18 - 4',
                true, // '5 * 3 - 1 >= 10 + 4 || 5 * 3 - 1 > 18 - 4',
                false // '5 * 3 - 1 >= 10 + 4 && 5 * 3 - 1 > 18 - 4'

              ];

              it('parses out and evaluates each expression', function() {
                exampleTokens.forEach((token, i) => {
                  assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
                });
              });
            });
          });
        });
        context('when the expression contains parentheses', function() {
          const exampleTokens = [
            '10 + 30 > (20 + 5)',
            '10 * (5 + 1)',
            '(true || false) && true',
            '(10 < 5 || 9 > 1) && "s" === "s"',
            '5 * (4 + 1) > 19 || 0 === 1',
            '5 * (3 - 1) >= 10 + 4 || 5 * (3 - 1) > 18 - 4',
            '(5 * 3) - 1 >= 10 + 4 || (5 * 3) - 1 > 18 - 4',
            '(5 > 1 && 10 < (10 + 15) || (23 + 5) * 2 > 9) && 2 > 1'
          ];
          const exampleContext = { someObj: { someMethod: x => x + 5 } }
          const expectedResults = [
            true,  // '10 + 30 > (20 + 5)',
            60,    // '10 * (5 + 1)',
            true,  // '(true || false) && true',
            true,  // '(10 < 5 || 9 > 1) && "s" === "s"',
            true,  // '5 * (4 + 1) > 19 || 0 === 1',
            false, // '5 * (3 - 1) >= 10 + 4 || 5 * (3 - 1) > 18 - 4',
            true,  // '(5 * 3) - 1 >= 10 + 4 || (5 * 3) - 1 > 18 - 4',
            true // '(5 > 1 && 10 < (10 + 15) || (23 + 5) * 2 > 9) && 2 > 1'
          ];

          it('evaluates the entire expression, recursing over each parenthetical sub-expression', function() {
            exampleTokens.forEach((token, i) => {
              assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
            });
          });
        });
        context('when the expression contains function calls', function() {
          const exampleContext = {
            obj: {
              addFive: x => x + 5,
              double: x => x * 2,
              allEven: arr => arr.every(e => e%2 === 0)
            }
          }
          const exampleTokens = [
            '10 + 30 > obj.addFive(20)',
            '10 + 30 <= obj.double(20)',
            '10 + 30 <= obj.double(20 + 5)',
            '20 > 10 && obj.allEven([2, 4, 6])',
            '20 > 10 && obj.allEven([2, 4, 9 - 3])',
            'obj.double(10) < 10'
          ];
          const expectedResults = [
            true,  // '10 + 30 > obj.addFive(20)',
            false, // '10 + 30 < obj.double(20)',
            true,  // '10 + 30 <= obj.double(20 + 5)',
            true,  // '20 > 10 && obj.allEven([2, 4, 6])',
            true,  // '20 > 10 && obj.allEven([2, 4, 9 - 3])',
            false  // 'obj.double(10) < 10'
          ];

          it('evaluates the entire expression, recursing over each parenthetical sub-expression', function() {
            exampleTokens.forEach((token, i) => {
              assert.equal(expectedResults[i], Parser.parseToken(token, exampleContext));
            });
          });
        });
      });
    });
  });
};
