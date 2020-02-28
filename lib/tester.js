// Elements of testing system //
// Core tester elements
class FailedAssertionError extends Error {
  constructor(message, testDescription) {
    super(message);
    this.name = "FailedAssertionError";
    this.testDescription = testDescription;
  }
}
const Tester = {};
Tester.it = (description, block) => {
  Tester.totalTests += 1;
  try {
    block();
    console.log(`It ${description}`);
    Tester.passedTests += 1;
  } catch (err) {
    if (err instanceof FailedAssertionError) {
      console.group(`Failed: It ${description}`);
      console.log(`${err.message}`);
      console.groupEnd();
    } else if (err instanceof SyntaxError){
      console.log(`Syntax Error: ${err.message}`);
    } else {
      throw err;
    }
  }
}
Tester.context = (description, block) => {
  console.group(description);
  block();
  console.groupEnd();
};
Tester.describe = Tester.context;
// Assertion types
Tester.assert = {};
Tester.assert.equal = (expected, actual) => {
  if (expected !== actual) {
    throw new FailedAssertionError(
      `Expected: ${expected} \nActual: ${actual} \nCompared for equality`
    );
  }
}
Tester.assert.true = (statement) => {
  Tester.assert.equal(statement, true);
};
Tester.assert.exists = (value) => {
  Tester.assert.true(value !== null && value !== undefined)
};

// Test runner //
const lib = process.cwd();
const fs = require("fs");

const runTests = () => {
  const testModules = [];
  fs.readdirSync(`${lib}/spec`).forEach(filename => testModules.push(require(`${lib}/spec/${filename}`))); // TODO: generalize this

  Tester.totalTests = 0;
  Tester.passedTests = 0;
  testModules.forEach(testModule => {
    Tester.currentTestModule = testModule;
    Tester.currentTestModule();
  });

  console.log(`${Tester.passedTests}/${Tester.totalTests} passing`);
};
runTests();
