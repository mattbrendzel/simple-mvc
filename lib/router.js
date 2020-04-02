"use strict";

const root = process.cwd();
const RouteTable = require(`${root}/config/routes.js`);
const regX = function(urlString) {
  urlString = '\^' + urlString.replace(/(\:\w+)/g, '\(\\d\+\)') + '\$';
  return new RegExp(urlString, 'i');
};

const HttpParser = require(`${root}/lib/http-parser`);

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
    const routeParams = getRouteParams(method, url);
    const bodyParams = ['POST', 'PUT', 'PATCH'].includes(method) ? HttpParser.parseBody(requestBody, headers) : {};
    const queryParams = HttpParser.parseParamString(queryString);
    return routeParams.extend(bodyParams).extend(queryParams);
  })
  .catch(function(parsingError){
    console.error('COULD NOT PARSE REQUEST:', parsingError);
  });
};

module.exports = {
  parse: parseRequest
}
