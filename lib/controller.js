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
  .then(function(){ // handle 'before action's
    if (controller.beforeAction[params.action]) {
      controller.beforeAction[params.action].forEach(function(cb){ cb(); })
    }
  })
  .then(function(){ // run the controller action
    controller[params.action]();
  }).catch(function(err){ console.error("Broke at action:", err); })
  .then(function(){ return controller.render(); }) // render the view
  .then(function(viewData){ // handle 'after action's
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
Controller.prototype.loadViewFor = function(action){
  let resource = this.resource;
  return new Promise(function(fulfill, reject){
    fs.readFile(`${root}/app/${resource}/views/${action}.xml`, 'utf8', function(err, data){
      err? reject(err) : fulfill(data);
    });
  })
  // .then(function(data){
  //   console.log(`FILE DATA INSIDE ./${resource}/views/${action}.xml:\n`, data);
  //   return data;
  // })
  .catch(function(err){
    console.error("FILE ERROR: View Not Found");
  });
},
Controller.prototype.render = function() {
  let controller = this;
  let params = this.params;
  console.log(`Rendering view for ${params.controller}#${params.action}`);
  return this.loadViewFor(params.action)
  .then(function(template){
    controller.posts = [
    		{ title:'Post 1', body: 'Lorem ipsum' },
    		{ title:'Post 2', body: 'dolor' },
    		{ title:'Post 3', body: 'sit amet' }
    ];
    controller.post = controller.posts[params.id - 1];
    return ViewEngine.render(template, controller);
  });
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
