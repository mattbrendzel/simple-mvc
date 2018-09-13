"use strict"

const http = require('http');
const fs = require('fs');
const root = process.cwd();

// DEPENDENCIES & SETUP
require(`${root}/lib/object-model.js`);
const Router = require(`${root}/lib/router.js`);
const App = require(`${root}/config/app.js`);
App.initialize();

// SERVER SETUP
const server = http.createServer(function(request, response){
  console.log(`Received a ${request.method} request at ${request.url}`);
  Router.parse(request)
  .then(function(params){ // Route the request
    console.log('incoming params:', params);
    return App.controllers[params.controller].handleRequest(params);
  })
  .then(function(responseData){  // Return Rendered View Data
    console.log('responseData:', responseData)
    response.write(responseData);
    response.end();
  })
});
server.listen(4000);