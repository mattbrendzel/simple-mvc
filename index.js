"use strict"

const http = require('http');
const fs = require('fs');
const root = process.cwd();

// DEPENDENCIES & SETUP
require(`${root}/lib/object-model.js`);
const Router = require(`${root}/lib/router.js`);
const App = require(`${root}/config/app.js`);
App.initialize();

const setContentTypeHeader = (responseObject, extension) => {
  const mime = {
      html: 'text/html',
      txt: 'text/plain',
      css: 'text/css',
      gif: 'image/gif',
      jpg: 'image/jpeg',
      png: 'image/png',
      svg: 'image/svg+xml',
      js: 'application/javascript'
  };
  responseObject.setHeader('Content-Type', mime[extension] || 'text/plain');
};

// SERVER SETUP
const server = http.createServer(function(request, response){
  console.log(`Received a ${request.method} request at ${request.url}`);
  Router.parse(request)
  .then(function(params){ // Route the request
    console.log('incoming params:', params);
    // If it matches a controller handle with that controller; otherwise, just serve it up.
    if (params.controller) {
      console.log("controller responding");
      return App.controllers[params.controller].handleRequest(params);
    } else if (request.url.match(/\/assets/)){
      console.log("serving asset: ", request.url);
      const filePath = request.url.split("assets/").slice(-1)[0];
      const extension = filePath.split(".").slice(-1)[0];
      setContentTypeHeader(response, extension);
      return App.loader.loadAsset(request.url.split("assets/").slice(-1)[0]);
    }
  })
  .catch(e => { // Handle errors
    console.log(e);
    return "";
  })
  .then(function(responseData){  // Return Rendered View Data
    console.log('responseData:', responseData)
    response.write(responseData);
    response.end();
  })
});
server.listen(4000);
