"use strict";

const root = process.cwd();
const Controller = require(`${root}/lib/controller.js`);
const CommentsController = new Controller('comments');

// Placeholder Data
const exampleComments = [
    { post_id: 1, body: 'No comment' },
    { post_id: 1, body: 'Comment comment comment comment comment chameleon' },
    { post_id: 2, body: 'Comment knock on my door' },
    { post_id: 2, body: 'Who writes this junk?'}
];

// How to define a controller.
CommentsController.index = function() {
  console.log('run INDEX action');
  if (this.params.post_id) {
    this.comments = exampleComments.filter((comment)=>{
      return comment.post_id === this.params.post_id;
    });
  } else {
    this.comments = exampleComments;
  }
};
CommentsController.show = function() {
  console.log('run SHOW action');
  this.comment = exampleComments[this.params.id - 1];
};
// CommentsController.new = function() {
//   console.log('run NEW action');
// };
// CommentsController.create = function() {
//   console.log('run CREATE action');
// };
// CommentsController.edit = function() {
//   console.log('run EDIT action');
// };
// CommentsController.update = function() {
//   console.log('run UPDATE action');
// };
// CommentsController.destroy = function() {
//   console.log('run DESTROY action');
// };

// Define 'before action' and 'after action' behavior.
// CommentsController.before(['index'], function() {
//   console.log("INDEX's 'before' action");
// });
// CommentsController.after(['index'], function() {
//   console.log("INDEX's 'after' action");
// });
// CommentsController.before(['show', 'new'], function() {
//   console.log('Runs before SHOW and NEW');
// });
// CommentsController.after(['edit'], function() {
//   console.log('Runs after EDIT');
// });

module.exports = CommentsController;
