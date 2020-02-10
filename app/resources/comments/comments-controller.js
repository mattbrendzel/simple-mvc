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

CommentsController.index = function() {
  if (this.params.post_id) {
    this.comments = exampleComments.filter((comment)=>{
      return comment.post_id === this.params.post_id;
    });
  } else {
    this.comments = exampleComments;
  }
};
CommentsController.show = function() {
  this.comment = exampleComments[this.params.id - 1];
};

module.exports = CommentsController;
