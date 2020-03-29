"use strict";

const root = process.cwd();
const Controller = require(`${root}/lib/controller.js`);
const PostsController = new Controller('posts');

// Placeholder Data
const examplePosts = [
    { title:'Post 1', body: 'Lorem ipsum' },
    { title:'Post 2', body: 'dolor' },
    { title:'Post 3', body: 'sit amet' }
];

// How to define a controller.
PostsController.index = function() {
  this.posts = examplePosts;
  // Unless otherwise specified, tries to render a view using data stored
  // on the controller object.
};
PostsController.show = function() {
  return this.render(examplePosts[this.params.id - 1],"json");
  // However, it can also render a JSON response.
};
PostsController.new = function() {
  // console.log('run NEW action');
};
PostsController.create = function() {
  console.log('run CREATE action');
  return this.render('success', "json");
};
PostsController.edit = function() {
  // console.log('run EDIT action');
};
PostsController.update = function() {
  console.log('run UPDATE action');
  return this.render('success', "json");
};
PostsController.destroy = function() {
  console.log('run DESTROY action');
  return this.render('success', "json");
};

// Define 'before action' and 'after action' behavior.
PostsController.before(['index'], function() {
  // console.log("INDEX's 'before' action");
});
PostsController.after(['index'], function() {
  // console.log("INDEX's 'after' action");
});
PostsController.before(['show', 'new'], function() {
  // console.log('Runs before SHOW and NEW');
});
PostsController.after(['edit'], function() {
  // console.log('Runs after EDIT');
});

module.exports = PostsController;
