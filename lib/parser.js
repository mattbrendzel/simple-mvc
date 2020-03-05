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

Parser.extractNextToken = function(str, separator = ',') {
  // Normally tokens are separated by commas (though other separators can be used).
  // However, strings, arrays, and objects can contain commas inside them, so they need to be handled differently.
  // We need to specifically find the index of the first un-nested separator (i.e. not inside a string, array, or object).
  const firstSeparatorIndex = indexOfFirstUnnestedMatch(separator, str);
  const token = (
    firstSeparatorIndex !== null ? str.slice(0, firstSeparatorIndex) : str
  ); // If there are no separators, the whole string is the token.

  let tokenType;
  const operatorMatcher = /(\+|((?<=\d+\s*)\-)|\*|\/|\%|\^|===?|<|>|<=|>=|\|\||\&\&|\(.*\))/;
  // Arithmetic (+, -, *, /) and logical (==, ===, <, >, <= >=, ||, &&) operators.
  // The subtraction matcher is ((?<=\d+\s*)\-) in order to not match negative numbers, which are not expressions.
  if (str.match(operatorMatcher) && indexOfFirstUnnestedMatch(str.match(operatorMatcher)[0], str) !== null) { // If an un-nested operator exists in the token
    tokenType = 'expression';
  } else if (token.match(/^\'.*\'$/) || token.match(/^\".*\"$/)) {
    tokenType = 'string';
  } else if (token.match(/^\[.*\]$/)) {
    tokenType = 'array';
  } else if (token.match(/^\{.*\}$/)) {
    tokenType = 'object';
  } else if (token.match(/null/)) {
    tokenType = 'nullval';
  } else if (token.match(/(true|false)/)) {
    tokenType = 'boolean';
  } else if (token.match(/\d+\.?\d*/)) {
    tokenType = 'number';
  } else if (token.match(/[\w\$]+(\.[\w\$]+)*/)) {
    // JS allows identifiers to include all alphanumerics, _, and $.
    // \w encompasses all but the $.
    tokenType = 'varName';
  } else {
    tokenType = 'undetermined';
  }
  return {
    originalText: str,
    token,
    tokenType,
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
    console.log(JSON.stringify(token),'is undefined;', err);
  }
};

const parseArrayToken = (token = "", context = {}) => {
  const arr = [];
  let parentTokenContent = token.slice(1, -1); // Get rid of outer []
  while (parentTokenContent.length > 0) {
    let extraction = Parser.extractNextToken(parentTokenContent, ','); // This will capture the next element as a token.
    arr.push(Parser.parseToken(extraction.tokenType, extraction.token, context)); // Recursively parse each array element
    parentTokenContent = extraction.remainingText;
  }
  return arr;
};

Parser.parseToken = function(tokenType, token, context) {
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
  }
};

module.exports = Parser;
