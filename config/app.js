"use strict";

const App = {};
const root = process.cwd();

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

/// REGISTER CONTROLLERS AND MODELS HERE ///
App.initialize = function(){
  console.log("App Initializing...");
  this.controllers = {};
  this.controllers['posts'] = require(`${root}/app/posts/posts-controller.js`);
  this.models = {};
}

/// REGISTER PARTIALS AND VIEW HELPERS HERE ///
App.registerPartial('partialA', '<h1> THIS IS A PARTIAL </h1>');
App.registerPartial('partialB', '<div> <h3><$ upperCase title $></h3> <p><$ body $></p> </div>');
App.registerInlineHelper('concat', function(){
  var args = Array.prototype.slice.call(arguments);
  return args.join('');
});

module.exports = App;