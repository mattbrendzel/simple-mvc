const Parser = {};

// Matchers //
const keyMatcher = /[a-zA-z\$][\w\$]*/;
const valueMatcher = /(?:[^\&\"\'\s\=\!\%]|(?:\%\d{2}))+/;
const pairMatcher = new RegExp(`${keyMatcher.source}\\=(?:${valueMatcher.source})?`);
const paramStringMatcher = new RegExp(`^${pairMatcher.source}(?:&${pairMatcher.source})*$`);

const kvPairsToObj = (kvPairs) => {
  return kvPairs.reduce((obj, [key, val]) => { obj[key] = val; return obj; }, {})
};

Parser.parseParamString = function(str){
  if (!str) return {};
  if (!(str.match(paramStringMatcher))) return null;
  try {
    return kvPairsToObj(
      str.split('&').map(pair => {
        return pair.split('=').map(element => decodeURI(element));
      })
    );
  } catch (e) {
    return null;
  }
};

Parser.parseBody = function(body, headers) {
  // Some types are being skipped for now, but they may be added in later
  switch(headers['content-type']) {
    // case 'application/javascript': break;
    case 'application/json':
      return JSON.parse(body);
    // case 'application/xml': break;
    case 'application/x-www-form-urlencoded':
      return Parser.parseParamString(body);
    // case 'text/html': break;
    // case 'text/plain': break;
    default: // All other content types
      if (headers['content-type'].match('multipart/form-data')) {
        const boundary = headers['content-type'].match(/(?<=.*boundary\=).*$/)[0]; // Capture text after "boundary="
        return kvPairsToObj(
          body.split(`${boundary}\r\n`).filter(line => line.match('form-data;')).map(line => {
            return line.match(/name\="(.*)"\r\n\r\n(.*)\r\n--/).slice(1, 3); // Extract data via capture groups
          })
        );
      } else return {};
  };
};

module.exports = Parser;
