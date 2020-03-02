// Elements of testing system //
// Core tester elements
const printNormal = function () { console.log("\x1b[0m", ...arguments); };
const printSuccess = function () { console.log("\x1b[32m", ...arguments, "\x1b[0m"); };
const printFailure = function () { console.log("\x1b[31m", ...arguments, "\x1b[0m"); };
const printSkipped = function () { console.log("\x1b[2m", ...arguments, "\x1b[0m"); };

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
    printSuccess(`It ${description}`);
    Tester.passedTests += 1;
  } catch (err) {
    if (err instanceof FailedAssertionError) {
      printFailure(`Failed: It ${description}`);
      console.group();
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
  printNormal(description);
  console.group();
  block();
  console.groupEnd();
};
Tester.describe = Tester.context;
Tester.xit = (description) => printSkipped("Skipped: It", description);
Tester.xcontext = (description) => printSkipped("Skipped: ", description);
Tester.xdescribe = Tester.xcontext;

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
const fs = require("fs");

const runTests = () => {
  const testModules = [];
  fs.readdirSync(`${__dirname}/spec`).forEach(filename => testModules.push(require(`${__dirname}/spec/${filename}`))); // TODO: generalize this

  Tester.totalTests = 0;
  Tester.passedTests = 0;
  testModules.forEach(testModule => {
    Tester.currentTestModule = testModule;
    Tester.currentTestModule();
  });

  console.log("\x1b[0m", `${Tester.passedTests}/${Tester.totalTests} passing`);
};
runTests();
