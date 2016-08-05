"use strict";

const root = process.cwd();
const Controller = require(`${root}/lib/controller.js`);
const PostsController = new Controller('posts');

// How to define a controller.
PostsController.index = function() {
  console.log('run INDEX action');
  this.posts = 'POSTS!!!!'
};
PostsController.show = function() {
  console.log('run SHOW action');
};
PostsController.new = function() {
  console.log('run NEW action');
};
PostsController.create = function() {
  console.log('run CREATE action');
};
PostsController.edit = function() {
  console.log('run EDIT action');
};
PostsController.update = function() {
  console.log('run UPDATE action');
};
PostsController.destroy = function() {
  console.log('run DESTROY action');
};

// Define 'before action' and 'after action' behavior.
PostsController.before(['index'], function() {
  console.log("INDEX's 'before' action");
});
PostsController.after(['index'], function() {
  console.log("INDEX's 'after' action");
});
PostsController.before(['show', 'new'], function() {
  console.log('Runs before SHOW and NEW');
});
PostsController.after(['edit'], function() {
  console.log('Runs after EDIT');
});

module.exports = PostsController;
