"use strict";

const App = {};
const root = process.cwd();

/// PARTIALS, CONTROLLERS AND MODELS REGISTERED HERE ///
App.initialize = function(){
  console.log("App Initializing...");
  App.loader = require(`${root}/lib/file-loader.js`);
  // Load all partials before loading any controllers (and consequently, views)
  App.loader.loadSharedPartials().then(partials => App.partials = partials)
  .then(() => {
    App.controllers = {};
    App.controllers['posts'] = require(`${root}/app/resources/posts/posts-controller.js`);
    App.controllers['comments'] = require(`${root}/app/resources/comments/comments-controller.js`);
    App.models = {};
  });
}

// For registering partials and helpers dynamically
App.registerPartial = function(name, str){
  App.partials = App.partials || {};
  App.partials[name] = str;
};
App.registerBlockHelper = function(name, cb){
  App.viewHelpers = App.viewHelpers || {};
  App.viewHelpers.block = App.viewHelpers.block || {};
  App.viewHelpers.block[name] = cb;
};
App.registerInlineHelper = function(name, cb){
  App.viewHelpers = App.viewHelpers || {};
  App.viewHelpers.inline = App.viewHelpers.inline || {};
  App.viewHelpers.inline[name] = cb;
};
/// EXAMPLE ///
// App.registerPartial('partialA', '<h2> THIS IS A PARTIAL </h2>');
// App.registerPartial('partialB', '<div> <h3><$ upperCase title $></h3> <p><$ body $></p> </div>');
App.registerInlineHelper('concat', function(){
  var args = Array.prototype.slice.call(arguments);
  return args.join('');
});

module.exports = App;
