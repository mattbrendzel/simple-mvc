module.exports = function() {
  const { describe, xdescribe, context, xcontext, it, assert } = this;
  describe('HTTP Request Parser', function() {
    const Parser = require('../http-parser.js');

    describe('.parseParamString', function() {
      context('when given a valid param string', function() {
        it('returns an object with the keys and values from the param string', function() {
          const testExamples = [
            "a=1",
            "a=1&b=2&c=3",
            "fruit=apple&vegetable=potato",
            "x=-1&y=-2&z=0",
            "name=John%20Doe&age=35",
            "test=",
            "",
          ];
          const expectedResults = [
            {a: '1'}, // "a=1",
            {a: '1', b: '2', c: '3'}, // "a=1&b=2&c=3",
            {fruit: 'apple', vegetable: 'potato'}, // "fruit=apple&vegetable=potato",
            {x: '-1', y: '-2', z: '0'}, // "x=-1&y=-2&z=0",
            {name: 'John Doe', age: '35'}, // "name=John%20Doe&age=35"
            {test: ''}, // "test="
            {}
          ];
          assert.deepEqual(expectedResults, testExamples.map(Parser.parseParamString));
        });
      });
      context('when given an invalid param string', function() {
        it('returns null', function() {
          const testExamples = [
            "=1",
            "name=John Doe",
            "key=!",
            "dog=%t"
          ];
          testExamples.forEach(example => assert.null(Parser.parseParamString(example)));
        });
      });
    });
    describe('.parseBody', function() {
      context('when the content type is "application/json"', function() {
        it('parses the JSON and returns an object', function() {
          const testExamples = [
            '{"a":1,"b":2}',
            '{"name":"John Doe","age":35}',
            '{"fruit":"apple","vegetable":"potato"}'
          ];
          const expectedResults = [
            {a: 1, b: 2}, // '{"a":1,"b":2}',
            {name: "John Doe", age: 35}, // '{"name":"John Doe","age":35}',
            {fruit: "apple", vegetable: "potato"} // '{"fruit":"apple","vegetable":"potato"}'
          ];
          assert.deepEqual(expectedResults, testExamples.map(ex => {
            return Parser.parseBody(ex, {"content-type": "application/json"});
          }))
        });
      });
      context('when the content type is "application/x-www-form-urlencoded"', function() {
        it('parses the body like a giant param string and returns an object', function() {
          const testExamples = [
            "a=1",
            "a=1&b=2&c=3",
            "fruit=apple&vegetable=potato",
            "x=-1&y=-2&z=0",
            "name=John%20Doe&age=35",
            "test=",
            "",
          ];
          const expectedResults = [
            {a: '1'}, // "a=1",
            {a: '1', b: '2', c: '3'}, // "a=1&b=2&c=3",
            {fruit: 'apple', vegetable: 'potato'}, // "fruit=apple&vegetable=potato",
            {x: '-1', y: '-2', z: '0'}, // "x=-1&y=-2&z=0",
            {name: 'John Doe', age: '35'}, // "name=John%20Doe&age=35"
            {test: ''}, // "test="
            {}
          ];
          assert.deepEqual(expectedResults, testExamples.map(ex => {
            return Parser.parseBody(ex, {"content-type": "application/x-www-form-urlencoded"});
          }))
        });
      });
      context('when the content type is "multipart/form-data"', function() {
        it('parses the body by splitting up k-v pairs using the boundary specified in the headers', function() {
          const boundary = `--------------------------341050394405283672041829`; // arbitrary number choice
          const headers = {'content-type': `multipart/form-data; boundary=${boundary}`}
          const buildFormDataBody = (obj) => {
            return Object.keys(obj).map(key => {
              return `${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${obj[key]}\r\n--`
            }).join('') + `${boundary}--`;
          }
          const testExamples = [
            {a: 1, b: 2},
            {name: "John Doe", age: 40},
            {fruit: "apple", vegetable: "potato"}
          ].map(buildFormDataBody);
          const expectedResults = [
            {a: "1", b: "2"},
            {name: "John Doe", age: "40"},
            {fruit: "apple", vegetable: "potato"}
          ];
          assert.deepEqual(expectedResults, testExamples.map(ex => Parser.parseBody(ex, headers)));
        });
      });
      context('when the content type is any other type', function() {
        it('returns an empty object', function() {
          const testExamples = [
            {body: "some plain text", headers: {"content-type": 'text/plain'}},
            {body: "<html></html>", headers: {"content-type": 'text/html'}},
            {body: "<person></person>", headers: {"content-type": 'application/xml'}},
            {body: "console.log('hello world')", headers: {"content-type": 'application/javascript'}}
          ];
          testExamples.forEach(example => {
            assert.deepEqual({}, Parser.parseBody(example.body, example.headers));
          });
        });
      });
    });
  });
};
