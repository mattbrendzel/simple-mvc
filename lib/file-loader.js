"use strict";

const fs = require('fs');
const root = process.cwd();

const FileLoader = {};

const filepathExists = function(filepath) {
  return new Promise(function(fulfill, reject){
    fs.access(`${root}/${filepath}`, function(err){
      err? reject(err) : fulfill(filepath);
    });
  })
};

const getDirectoryContents = function(path) {
  return new Promise(function(fulfill, reject){ // Get contents of directory
    fs.readdir(`${root}/${path}`, {encoding: 'utf8', withFileTypes: true}, function(err, files){
      // Note: With `withFileTypes` set to true, this will return an array of Dirent objects.
      // See https://nodejs.org/api/fs.html#fs_class_fs_dirent
      err? reject(err) : fulfill(files);
    });
  });
};

// findFileWithin : recursively search a given directory for a file
const findFileWithin = function(path, targetFilename) {
  // see if it's in the specified directory
  return filepathExists(`${path}/${targetFilename}`)
  .catch(function(err){
    getDirectoryContents(path)
    .then(function(entities){ // Determine which things in the directory are subdirectories
      let subdirectories = entities.filter(entity => entity.isDirectory()).map(entity => entity.name);
      if (subdirectories.length === 0) { return Promise.reject(); }
      // If subdirectories exist, search them recursively.
      let promArray = subdirectories.map(function(subdirectory){
        return findFileWithin(`${path}/${subdirectory}`,targetFilename).catch(function(err){ return null; });
      });
      return Promise.all(promArray)
    })
    .then(function(results){
      return results.filter(function(r){ return r; })[0];
    })
    .catch(() => { // Raise error
      FileLoader.raiseError(
        new Error(`Failed - Could not find file ${targetFilename} in ${path}`)
      );
    });
  });
};

const loadFile = function(filepath) {
  return new Promise(function(fulfill, reject){
    fs.readFile(`${root}/${filepath}`, 'utf8', function(err, data){
      err? reject(err) : fulfill(data);
    });
  });
};

FileLoader.loadAsset = function(pathToAsset){ // Manages asset pipeline
  return loadFile(`app/assets/${pathToAsset}`)
  .catch(() => loadFile(`lib/assets/${pathToAsset}`))
  .catch(() => FileLoader.raiseError(new Error("Asset not found.")));
};

FileLoader.loadLayout = function(layoutName) {
  return loadFile(`app/layouts/${layoutName}.xml`)
  .catch(() => FileLoader.raiseError(new Error("File Error: Layout template not found.")));
}

FileLoader.loadPartial = function(partialName) {
  return loadFile(`app/resources/shared/${partialName}.xml`)
  .catch(() => FileLoader.raiseError(new Error("File Error: Partial template not found.")));
}

FileLoader.loadView = function(resource, action) {
  return loadFile(`app/resources/${resource}/views/${action}.xml`)
  .catch(() => FileLoader.raiseError(new Error("File Error: View template not found.")));
}

FileLoader.raiseError = function(error) {
  console.log(error);
  return Promise.reject(error); // Bubble up errors
}

// Testing
// filepathExists("public/favicon.ico")
// .then(function(filepath){
//   console.log("Found file at", filepath)
// })
// .catch(function(err){
//   console.log("ERROR: ",err);
// });
// findFileInDirectory("","favicon.ico")
// .then(function(result){
//   console.log(result? `Location: ${result}` : "Not Found");
// })
// loadFile("public/stylesheets/main.css")
// .then(console.log);
// FileLoader.loadAsset("main.css")
// .then(console.log);

module.exports = FileLoader;
