"use strict";

module.exports = {
  'get /posts': 'posts#index',
  'post /posts': 'posts#create',
  'get /posts/:id': 'posts#show',
  'put /posts/:id': 'posts#update',
  'patch /posts/:id': 'posts#update',
  'delete /posts/:id': 'posts#destroy',
  'get /comments': 'comments#index',
  'get /comments/:id': 'comments#show',
}
