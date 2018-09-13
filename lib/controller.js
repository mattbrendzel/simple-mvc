"use strict";

const fs = require('fs');
const root = process.cwd();

const ViewEngine = require(`${root}/lib/view-engine.js`);

const Controller = function(resource) {
  this.params = null;
  this.resource = resource;
  this.beforeAction = {};
  this.afterAction = {};
};

Controller.prototype.handleRequest = function(params){
  let controller = this;
  controller.params = params;
  return Promise.resolve()
  .then(function(){ // handle 'before action' callbacks
    if (controller.beforeAction[params.action]) {
      controller.beforeAction[params.action].forEach(function(cb){ cb(); })
    }
  })
  .then(function(){ // run the controller action and render a response
    // If the controller action returns a promise (from having called 'render')
    // return that promise; if not, call 'render'and return the resulting promise.
    return controller[params.action]() || controller.render();
  })
  .then(function(viewData){ // handle 'after action' callbacks
    if (controller.afterAction[params.action]) {
      controller.afterAction[params.action].forEach(function(cb){ cb(); })
    }
    return viewData;
  })
  .catch(function(err){
    console.error('FAILED');
    console.log(err);
    return `
    <html>
      <body>
        ${err}
      </body>
    </html>
    `;
  })
};
Controller.prototype.render = function(data, format) {
  let controller = this;
  let params = this.params;
  if (data && format === "json") {
    console.log(`Rendering a JSON response`);
    return JSON.stringify(data);
  } else {
    console.log(`Rendering view for ${params.controller}#${params.action}`);
    return ViewEngine.renderViewFor(controller);
  }
};
Controller.prototype.before = function (actions, cb) {
  let controller = this;
  actions.forEach(function(action){
    controller.beforeAction[action] = controller.beforeAction[action] || [];
    controller.beforeAction[action].push(cb);
  });
};
Controller.prototype.after = function (actions, cb) {
  let controller = this;
  actions.forEach(function(action){
    controller.afterAction[action] = controller.afterAction[action] || [];
    controller.afterAction[action].push(cb);
  });
};

module.exports = Controller;
