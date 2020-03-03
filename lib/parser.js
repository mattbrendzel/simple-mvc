const Parser = {};

const indexOfFirstFreeChar = function(targetChar, str) { // Note: targetChar cannot be any of [, ], {, }, ', ", :
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
    if (!index && char === targetChar && depths.array === 0 && depths.obj === 0 && !depths.string) {
      index = i;
    }
  });
  return index;
}

Parser.extractNextToken = function(str) {
  // Normally (we're assuming, for now) separate tokens are delineated by commas.
  // However, strings, arrays, and objects can contain commas inside them, so they need to be handled differently.
  // We need to specifically find the index of the first 'free' comma (i.e. not inside a string, array, or object).
  const firstDelimiterIndex = indexOfFirstFreeChar(',', str);
  const token = firstDelimiterIndex !== null ? str.slice(0, firstDelimiterIndex) : str;
  const firstChar = token.slice(0, 1);

  let tokenType;
  if (token.match(/^\'.*\'$/) || token.match(/^\".*\"$/)) {
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

module.exports = Parser;
