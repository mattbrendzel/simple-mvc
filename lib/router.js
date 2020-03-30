"use strict";

const root = process.cwd();
const RouteTable = require(`${root}/config/routes.js`);
const regX = function(urlString) {
  urlString = '\^' + urlString.replace(/(\:\w+)/g, '\(\\d\+\)') + '\$';
  return new RegExp(urlString, 'i');
};

const kvPairsToObj = (kvPairs) => {
  return kvPairs.reduce((obj, [key, val]) => { obj[key] = val; return obj; }, {})
};

const parseQueryString = function(queryString){
  let queryParams = {};
  if (queryString) {
  	queryString.split('&').forEach(function(pair){
    	pair = pair.split('=');
    	queryParams[pair[0]] = pair[1];
  	});
  }
  return queryParams;
};

const parseBody = function(body, headers) {
  // Some types are being skipped for now, but they may be added in later
  switch(headers['content-type']) {
    case 'application/javascript': break;
    case 'application/json':
      return JSON.parse(body);
    case 'application/xml': break;
    case 'application/x-www-form-urlencoded':
      return kvPairsToObj( body.split('&').map(pair => pair.split('=')) );
    case 'text/html': break;
    case 'text/plain': break;
    default: // All other content types
      if (headers['content-type'].match('multipart/form-data')) {
        const boundary = headers['content-type'].match(/(?<=.*boundary\=).*$/)[0]; // Capture text after "boundary="
        return kvPairsToObj(
          body.split(`${boundary}\r\n`).filter(line => line.match('form-data;')).map(line => {
            return line.match(/name\="(.*)"\r\n\r\n(.*)\r\n--/).slice(1, 3); // Extract data via capture groups
          })
        );
      } else return '';
  };
};

const getRouteParams = function(method, url){
  let routeParams = {
    controller: null,
    action: null
  };

  for (let route in RouteTable) {
    let matches = `${method} ${url}`.match(regX(route));
    if (matches) {
  		routeParams.controller = RouteTable[route].split('#')[0];
  		routeParams.action = RouteTable[route].split('#')[1];
  		let dynamicSegments = route.match(/:(\w+)/g);
  		if (dynamicSegments) {
        dynamicSegments = dynamicSegments.map(function(name){ return name.slice(1); });
  		  for (let i = 0; i < dynamicSegments.length; i++) {
  		    routeParams[dynamicSegments[i]] = matches[i+1];
  		  }
  		}
    }
  }
  return routeParams;
};

const parseRequest = function(request) {
  let url = request.url.split('?')[0],
      queryString = request.url.split('?')[1],
      method = request.method,
      headers = request.headers,
      requestBody = '';
  return new Promise(function(fulfill, reject){ // Receive request
    request.on('data', function(data){ requestBody += data; });
    request.on('end', fulfill);
    request.on('error', reject);
  })
  .catch(function(transmissionError){
    console.error('TRANSMISSION ERROR:', transmissionError);
  })
  .then(function(){ // Parse request to get params
    let routeParams = getRouteParams(method, url);
    const bodyParams = ['POST', 'PUT', 'PATCH'].includes(method) ? parseBody(requestBody, headers) : {};
    let queryParams = parseQueryString(queryString);
    let params = routeParams.extend(bodyParams).extend(queryParams);
    return params;
  })
  .catch(function(parsingError){
    console.error('COULD NOT PARSE REQUEST:', parsingError);
  });
};

module.exports = {
  parse: parseRequest
}
