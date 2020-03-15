const Parser = {};

const indexOfFirstUnnestedMatch = function(targetSeq, str) { // Note: targetSeq cannot be any of [, ], {, }, ', ", :
  const depths = {array: 0, obj: 0, string: null};
  let index;

  str.split('').forEach((char, i) => {
    depths.array += (char === '['? 1 : char === ']'? -1 : 0);
    depths.obj += (char === '{'? 1 : char === '}'? -1 : 0);
    // Unlike arrays and objects, strings can't really "nest", so their depth is binary;
    // you're either in a string (single- or double-quoted) or you're not.
    if (!depths.string && ["'", '"'].includes(char)) {
      depths.string = char; // Entering a string
    } else if (depths.string === char) {
      depths.string = null; // Leaving a string
    }
    // First, check if you're at the outermost layer of nesting
    // Then, look at the next N chars to see if they match the target sequence.
    if (!index && depths.array === 0 && depths.obj === 0 && !depths.string) {
      if (str.slice(i, i + targetSeq.length) === targetSeq) index = i;
    }
  });
  return index;
}

// Matchers //
// Operators
const arithmaticOperatorMatcher =  /\+|(?:(?<=\d+\s*)\-)|\*|\/|\%/;  // Arithmetic operators: +, -, *, /, %
  // Note: The subtraction matcher is ((?<=\d+\s*)\-) in order to not match negative numbers, for which the '-' is not an operator.
const comparisonOperatorMatcher = /[\!\=]==?|<|>|<=|>=/;              // Comparison operators: ==, ===, !=, !==, <, >, <=, >=
const logicalOperatorMatcher = /\|\||\&\&|!/;                         // Logical operators: ||, &&, !
const operatorMatcher = new RegExp(
  `${arithmaticOperatorMatcher.source}|${comparisonOperatorMatcher.source}|${logicalOperatorMatcher.source}`
);
// Operands
const numberMatcher = /\-?\d+\.?\d*/;
const booleanMatcher = /true|false/;
const nullMatcher = /null/;
const objectMatcher = /^\{.*\}$/;
const arrayMatcher = /^\[.*\]$/;
const stringMatcher = /^\'.*?\'$|^\".*?\"$/; // This regex needs to be tinkered with
const identifierMatcher = /[\w\$]+/;
const varMatcher = new RegExp(`${identifierMatcher.source}(?:\\.${identifierMatcher.source})*`);
const functionCallMatcher = new RegExp(`${varMatcher.source}?\\(.*\\)`); // Treat parens as a special kind of function call where we return the value of the argument.
const functionCallMatcherWithCapture = new RegExp(`(${varMatcher.source})?\\((.*)\\)`);
const operandMatcher = new RegExp(
  `${numberMatcher.source}|${booleanMatcher.source}|${nullMatcher.source
  }|${objectMatcher.source}|${arrayMatcher.source}|${stringMatcher.source
  }|${varMatcher.source}|${functionCallMatcher.source}`
);
// Other Matchers
const kvpairMatcher = new RegExp(`${identifierMatcher.source}\\s*\:\\s*.+`);
// Expressions
const arithmaticExpressionMatcherWithCapture = new RegExp(`(${operandMatcher.source})\\s*(${arithmaticOperatorMatcher.source})\\s*(${operandMatcher.source})`);
const comparisonExpressionMatcherWithCapture = new RegExp(`(${operandMatcher.source})\\s*(${comparisonOperatorMatcher.source})\\s*(${operandMatcher.source})`);
const logicalExpressionMatcherWithCapture = new RegExp(`(${operandMatcher.source})?\\s*(${logicalOperatorMatcher.source})\\s*(${operandMatcher.source})`);

Parser.identifyTokenType = function(token) {
  if (token.match(functionCallMatcher) ||                                                                   // If the token includes a function call, or
     (token.match(operatorMatcher) && indexOfFirstUnnestedMatch(token.match(operatorMatcher)[0], token) !== null)) { // if an un-nested operator exists in the token
    return 'expression';
  } else if (token.match(stringMatcher)) {
    return 'string';
  } else if (token.match(arrayMatcher)) {
    return 'array';
  } else if (token.match(objectMatcher)) {
    return 'object';
  } else if (token.match(kvpairMatcher)) {
    return 'kvpair';
  } else if (token.match(nullMatcher)) {
    return 'nullval';
  } else if (token.match(booleanMatcher)) {
    return 'boolean';
  } else if (token.match(numberMatcher)) {
    return 'number';
  } else if (token.match(varMatcher)) {
    // JS allows identifiers to include all alphanumerics, _, and $.
    // \w encompasses all but the $.
    return 'varName';
  } else {
    return 'undetermined';
  }
};

Parser.extractNextToken = function(str, separator = ',') {
  // Normally tokens are separated by commas (though other separators can be used).
  // However, strings, arrays, and objects can contain commas inside them, so they need to be handled differently.
  // We need to specifically find the index of the first un-nested separator (i.e. not inside a string, array, or object).
  const firstSeparatorIndex = indexOfFirstUnnestedMatch(separator, str);
  const token = (
    firstSeparatorIndex !== null ? str.slice(0, firstSeparatorIndex) : str
  ); // If there are no separators, the whole string is the token.

  return {
    originalText: str,
    token,
    tokenType: Parser.identifyTokenType(token),
    remainingText: str.replace(token, '').replace(new RegExp(`\s*,?\s*`), '').trim()
      // Remove the new token from the original string.
      // If the token is followed by a comma (like it probably is), strip out the comma and any extra whitespace.
      // Unfortunately, this can't be done as a single `replace` unless you first sanitize any potential
      // RegExp characters in the token; running `replace` twice is a simpler solution.
  };
};

const parseVariableToken = (token = "", context = {}) => { // "x.y"
  let propNames = token.split('.');
  let value = context;
  try {		// winnow down through nested properties ('.' only)
    for (let i = 0; i < propNames.length; i++) {
      value = value[propNames[i]];
    }
    return value;
  }
  catch(err) {  // variable is undefined in given context
    console.log(JSON.stringify(token),'is undefined');
  }
};

const parseArrayToken = (token = "", context = {}) => {
  const arr = [];
  let parentTokenContent = token.slice(1, -1); // Get rid of outer []
  while (parentTokenContent.length > 0) {
    let extraction = Parser.extractNextToken(parentTokenContent, ','); // Capture the next element as a token.
    arr.push(Parser.parseToken(extraction.token, context)); // Recursively parse each array element and add the parsed value to the memo array.
    parentTokenContent = extraction.remainingText; // Update the source text to exclude extracted tokens.
  }
  return arr;
};

const parseObjectToken = (token = "", context = {}) => {
  const obj = {};
  let parentTokenContent = token.slice(1, -1); // Get rid of outer {}
  while (parentTokenContent.length > 0) {
    let extraction = Parser.extractNextToken(parentTokenContent, ','); // Capture the next K-V pair as a token.
    let [ , keyToken, valToken, ...rest] = extraction.token.match(/([\w\$]+)\s*\:\s*(.+)/); // Pull out sub-tokens for the key and the value
    let valExtraction = Parser.extractNextToken(valToken, ','); // Identify what kind of token vToken is
    obj[keyToken] = Parser.parseToken(valExtraction.token, context); // Update the memo object
    parentTokenContent = extraction.remainingText; // Update the source text to exclude extracted tokens
  }
  return obj;
};

const evaluateOperation = (operator, operands) => {
  switch(operator) {
    case '*':   return operands[0] * operands[1];
    case '/':   return operands[0] / operands[1];
    case '%':   return operands[0] % operands[1];
    case '+':   return operands[0] + operands[1];
    case '-':   return operands[0] - operands[1];
    case '===': return operands[0] === operands[1];
    case '!==': return operands[0] !== operands[1];
    case '==':  return operands[0] == operands[1];
    case '!=':  return operands[0] != operands[1];
    case '<':   return operands[0] < operands[1];
    case '>':   return operands[0] > operands[1];
    case '<=':  return operands[0] <= operands[1];
    case '>=':  return operands[0] >= operands[1];
    case '!':   return !operands[0];
    case '||':  return operands[0] || operands[1];
    case '&&':  return operands[0] && operands[1];
  }
};

const parseExpressionToken = (token = "", context = {}) => {
  let tokenClone = token.slice(0);

  // Evaluate Parens/Functions

  // Evaluate Operators
  const operatorPrecedenceTiers = [ // List all permitted operators, tiered by order of operation
    ['!'], // NOT operations are highest of logical operators, and even come before normal arithmatic and comparison operators.
    ['*', '/', '%'], // Multiplication, division, and modulus are of equal precedence, executed left-to-right
    ['+', '-'], // Addition and subtraction are of equal precedence, executed left-to-right
    ['<', '>', '<=', '>='], // GT(e) and LT(e) are of equal precedence, executed left-to-right,
    ['===', '!==', '==', '!='], // Equality and inequality are of equal precedence, executed left-to-right
    ['&&'], // AND operations are in the middle
    ['||'] // OR operations are the lowest
  ];

  operatorPrecedenceTiers.forEach(operators => {
    const operatorsMatcher = new RegExp(operators.map(operator => `\\${operator.split('').join('\\')}`).join('|'));
    let expressionMatcherWithCapture = new RegExp(
      operators.join('') ===  '!'
        ? `\\!(${operandMatcher.source})` // Logical NOT only has one operand, so use a different expression matcher
        : `(${operandMatcher.source})\\s*(${operatorsMatcher.source})\\s*(${operandMatcher.source})`
    )

    if (tokenClone.match(operatorsMatcher)) {
      if (operators.join('') === '!') {
        tokenClone = tokenClone.replace(expressionMatcherWithCapture, (_, operandToken) => evaluateOperation('!', [Parser.parseToken(operandToken)]).toString());
      } else {
        tokenClone = tokenClone.replace(expressionMatcherWithCapture, function(_, operandOneToken, operationToken, operandTwoToken) {
          return evaluateOperation(operationToken, [operandOneToken, operandTwoToken].map(t => Parser.parseToken(t))).toString();
        });
      }
    }
  });

  return Parser.parseToken(tokenClone); // tokenClone should contain a single value.
};

Parser.parseToken = function(token, context, tokenType = null) {
  tokenType = tokenType || Parser.identifyTokenType(token);
  switch(tokenType) {
    case 'nullval':
      return null;
    case 'boolean':
      return token === 'true';
    case 'number':
      return Number(token);
    case 'string':
      return token.slice(1, -1);
    case 'varName':
      return parseVariableToken(token, context);
    case 'array':
      return parseArrayToken(token, context);
    case 'object':
      return parseObjectToken(token, context);
    case 'expression':
      return parseExpressionToken(token, context);
  }
};

module.exports = Parser;
