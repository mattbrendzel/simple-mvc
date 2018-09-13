"use strict";

module.exports = {
  'get /posts': 'posts#index',
  'get /posts/:id': 'posts#show',
  'get /comments': 'comments#index',
  'get /comments/:id': 'comments#show',
}
