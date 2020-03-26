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
// Matchers for Literals
const numberMatcher = /\-?\d+\.?\d*/;
const booleanMatcher = /true|false/;
const nullMatcher = /null/;
const objectMatcher = /\{.*\}/;
const arrayMatcher = /\[.*\]/;
const stringMatcher = /\'.*?\'|\".*?\"/;
// Matchers for Non-Literals
const identifierMatcher = /[a-zA-z$][\w\$]*/; // Identifiers must start with a letter
const referenceMatcher = new RegExp(
  // String or array literal followed by 1+ subreferences
  `(?:${arrayMatcher.source}|${stringMatcher.source})(?:\\.${identifierMatcher.source})+|` +  // or
  // An identifier, followed by any number of sub-references
  `(?:${identifierMatcher.source})(?:\\.${identifierMatcher.source})*`
);
// Matchers for Operators
const parenOperatorMatcher = /\(.*\)/;
const arithmaticOperatorMatcher =  /\+|(?:(?<=\d+\s*)\-)|\*|\/|\%/;  // Arithmetic operators: +, -, *, /, %
      // Note: The subtraction matcher is ((?<=\d+\s*)\-) in order to not match negative numbers, for which the '-' is not an operator.
const comparisonOperatorMatcher = /[\!\=]==?|<|>|<=|>=/;              // Comparison operators: ==, ===, !=, !==, <, >, <=, >=
const logicalOperatorMatcher = /\|\||\&\&|!/;                         // Logical operators: ||, &&, !
const operatorMatcher = new RegExp(
  `${parenOperatorMatcher.source
  }|${arithmaticOperatorMatcher.source
  }|${comparisonOperatorMatcher.source
  }|${logicalOperatorMatcher.source}`
);
const functionCallMatcher = new RegExp(`(?:${referenceMatcher.source})?\\(.*?\\)`);
const functionCallMatcherWithCapture = new RegExp(`(${referenceMatcher.source})?\\((.*)\\)`);
const operandMatcher = new RegExp(
  `${numberMatcher.source}|${booleanMatcher.source}|${nullMatcher.source
  }|${objectMatcher.source}|${arrayMatcher.source}|${stringMatcher.source
  }|${referenceMatcher.source}|${functionCallMatcher.source}`
);
// Whole Token Matchers (i.e. is this entire token an X?); this is necessary because strings can include arrays/objects, and vice versa.
const wholeTokenObjectMatcher = new RegExp(`^${objectMatcher.source}$`);
const wholeTokenArrayMatcher = new RegExp(`^${arrayMatcher.source}$`);
const wholeTokenStringMatcher = new RegExp(`^${stringMatcher.source}$`);
// Other Matchers
const kvpairMatcher = new RegExp(`${identifierMatcher.source}\\s*\:\\s*.+`);

Parser.identifyTokenType = function(token) {
  // Note: This order matters!
  // Expressions can contain any other types here within them, so something that matches the expression matcher
  // will also always match other matchers. Therefore, check for expressions first.
  // Similarly, arrays, and objects can each contain any other type of data (including each other), and
  // and strings can contain almost any sequence of characters, so it can easily trigger other matchers.
  // The keys in key-value pairs all look like references, so they need to be ruled out before we check for references.
  // Null, true, and false also all look like references, so they need to be ruled out before we check for references.
  // Since references can be rooted in arrays, and arrays can contain numbers, check for references before checking for numbers.
  if (token.match(functionCallMatcher) ||                                                                   // If the token includes a function call, or
     (token.match(operatorMatcher) && indexOfFirstUnnestedMatch(token.match(operatorMatcher)[0], token) !== null)) { // if an un-nested operator exists in the token
    return 'expression';
  } else if (token.match(wholeTokenStringMatcher)) {
    return 'string';
  } else if (token.match(wholeTokenArrayMatcher)) {
    return 'array';
  } else if (token.match(wholeTokenObjectMatcher)) {
    return 'object';
  } else if (token.match(kvpairMatcher)) {
    return 'kvpair';
  } else if (token.match(nullMatcher)) {
    return 'nullval';
  } else if (token.match(booleanMatcher)) {
    return 'boolean';
  } else if (token.match(referenceMatcher)) {
    return 'reference';
  } else if (token.match(numberMatcher)) {
    return 'number';
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

// Parser.parseToken helper functions and relevant constants //
const evaluateReferenceChain = (rootValue, propNames) => {
  let value = rootValue;
  try {               // winnow down through nested property names
    for (let i = 0; i < propNames.length; i++) {
      value = value[propNames[i]];
    }
    return value;
  }
  catch(err) {  // reference is undefined in given context
    console.log(JSON.stringify(token),'is undefined');
  }
}

const parseReferenceToken = (token = "", context = {}) => { // "x.y", "'test.length'"
  const firstSegment = Parser.extractNextToken(token);
  return (firstSegment.tokenType === 'array' || firstSegment.tokenType === 'string')
    ? evaluateReferenceChain(parseToken(firstSegment.token), firstSegment.remainingText.slice(1))
    : evaluateReferenceChain(context, token.split('.'));
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

const operatorPrecedenceTiers = [ // List of all permitted operators, tiered by order of operation
  { operators: ['()'], matcher: /\(.*\)/ }, // Parentheses come before any other operators
  { operators: ['!'], matcher: /\![^\=]/ }, // NOT operations are highest of logical operators, and even come before normal arithmatic and comparison operators.
  { operators: ['*', '/', '%'], matcher: /\*|\/|\%/ }, // Multiplication, division, and modulus are of equal precedence, executed left-to-right
  { operators: ['+', '-'], matcher: /\+|(?:(?<=\d+\s*)\-)/ }, // Addition and subtraction are of equal precedence, executed left-to-right
  { operators: ['<', '>', '<=', '>='], matcher: /\<|\>|\<\=|\>\=/ }, // GT(e) and LT(e) are of equal precedence, executed left-to-right,
  { operators: ['===', '!==', '==', '!='], matcher: /[\!\=]\=\=?/ },// Equality and inequality are of equal precedence, executed left-to-right
  { operators: ['&&'], matcher: /\&\&/ }, // AND operations are in the middle
  { operators: ['||'], matcher: /\|\|/ } // OR operations are the lowest
];

const parseExpressionToken = (token = "", context = {}) => {
  let tokenClone = token.slice(0);

  // Evaluate Function Calls

  // Evaluate Operators
  operatorPrecedenceTiers.forEach(tier => {
    let expressionMatcherWithCapture;
    if (tier.operators[0] === '()') { //
      expressionMatcherWithCapture = new RegExp(`\\(([^\\(]*?)\\)`);
      // Parentheses is a unary operator.
    } else if (tier.operators[0] === '!') {
      expressionMatcherWithCapture = new RegExp(`\\!(${operandMatcher.source})`);
      // Logical NOT is a unary operator.
    } else {
      expressionMatcherWithCapture = new RegExp(`(${operandMatcher.source})\\s*(${tier.matcher.source})\\s*(${operandMatcher.source})`);
    }

    while (tokenClone.match(tier.matcher)) {
      if (tier.operators[0] === "()") {
        tokenClone = tokenClone.replace(expressionMatcherWithCapture, (_, operandToken) => Parser.parseToken(operandToken, context));
      } else if (tier.operators[0] === '!') {
        tokenClone = tokenClone.replace(expressionMatcherWithCapture, (_, operandToken) => {
          return evaluateOperation('!', [Parser.parseToken(operandToken, context)]).toString();
        });
      } else {                          // All other operators
        tokenClone = tokenClone.replace(expressionMatcherWithCapture, function (_, operandOneToken, operationToken, operandTwoToken){
          return evaluateOperation(operationToken, [operandOneToken, operandTwoToken].map(t => Parser.parseToken(t, context))).toString();
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
    case 'reference':
      return parseReferenceToken(token, context);
    case 'array':
      return parseArrayToken(token, context);
    case 'object':
      return parseObjectToken(token, context);
    case 'expression':
      return parseExpressionToken(token, context);
  }
};

module.exports = Parser;
