"use strict"

Object.prototype.extend = function(newObj) {
  for (let key in newObj) {
    if (newObj.hasOwnProperty(key) && !this.hasOwnProperty(key)) {
      this[key] = newObj[key];
    }
  }
  return this;
};
Object.prototype.extendUnsafe = function(newObj) {
  for (let key in newObj) {
    if (newObj.hasOwnProperty(key)) {
      this[key] = newObj[key];
    }
  }
  return this;
};
//// TESTS
// console.log({a: 1, b: 2}.extend({b: 10, c: 3})); // {a: 1, b: 2, c:3}
// console.log({a: 1, b: 2}.extendUnsafe({b: 10, c: 3})); // {a: 1, b: 10, c:3}
