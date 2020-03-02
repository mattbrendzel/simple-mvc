const Parser = {};

Parser.extractNextToken = function(str) { //TODO: Refactor this later
  let firstChar = str.slice(0, 1);
  let token, tokenType;

  if (["'", '"'].includes(firstChar)) { // extracting a string
    tokenType = 'string';
    let pairIndex = str.slice(1).indexOf(firstChar) + 1;
    token = str.slice(0, pairIndex + 1);
  } else if (firstChar === '[' ) { // extracting an array
    tokenType = 'array';
    let depthCount = 1;
    let bufferIndex = 0;
    while (depthCount > 0) {
      bufferIndex++;
      depthCount += (str[bufferIndex] === '[') ? 1 : (str[bufferIndex] === ']') ? -1 : 0;
    }
    token = str.slice(0, bufferIndex + 1);
  } else if (firstChar === '{') { // extracting an object
    tokenType = 'object';
    let depthCount = 1;
    let bufferIndex = 0;
    while (depthCount > 0) {
      bufferIndex++;
      depthCount += (str[bufferIndex] === '{') ? 1 : (str[bufferIndex] === '}') ? -1 : 0;
    }
    token = str.slice(0, bufferIndex + 1);
  } else {  // extracting anything else (i.e. a "basic" value); this also includes elements of an array, k-v pairs in an object, and variables
    tokenType = 'basic';
    token = str.slice(0, str.indexOf(',')).trim();
  }
  return {
    originalText: str,
    token,
    tokenType,
    remainingText: str.replace(token, '').replace(new RegExp(`\s*,?\s*`), '').trim() // if the token is followed by a comma, strip out the comma (and whitespace)
     // This can't be done as a single `replace`, unfortunately, unless you first
     // sanitize any potential RegExp characters in the token; running `replace` twice is a good deal simpler.
  };
};

module.exports = Parser;