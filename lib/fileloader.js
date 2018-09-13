"use strict";

const fs = require('fs');
const root = process.cwd();

const FileLoader = function() {};

const filepathExists = function(filepath) {
  return new Promise(function(fulfill, reject){
    fs.access(`${root}/${filepath}`, function(err){
      err? reject(err) : fulfill(filepath);
    });
  })
};

const findFileInDirectory = function(path, targetFilename) {
  // see if it's in the specified directory
  console.log(`checking ${path}`);
  return filepathExists(`${path}/${targetFilename}`)
  .catch(function(err){
    console.log(`Not in root of ${path}`)
    return new Promise(function(fulfill, reject){ // Get all directory files
      fs.readdir(`${root}/${path}`, {encoding: 'utf8', withFileTypes: true}, function(err, files){
        err? reject(err) : fulfill(files);
      });
    })
    .then(function(filenames){ // Determine which files are subdirectories
      console.log("checking", path, "contents:", filenames);
      let promArray = filenames.map(function(f){
        return new Promise(function(fulfill, reject){ // Return an object representing each file's name and whether or not it is a subdirectory
          fs.stat(`${root}/${path}/${f}`,function(err, stats){
            err? reject(err) : fulfill({filename: f, isDir: stats.isDirectory()})
          })
        });
      });
      return Promise.all(promArray);
    })
    .then(function(fileStats){ // Recursively call 'findFileInDirectory'  on subdirectories
      let subdirectories = fileStats.filter((st)=>st.isDir).map((st)=>st.filename);
      console.log(`Subdirectories of ${path}: ${subdirectories.toString()}`);
      if (subdirectories.length === 0) { return subdirectories; }
      let promArray = subdirectories.map(function(filename){
        return findFileInDirectory(`${path}/${filename}`,targetFilename).catch(function(err){ return null; });
      });
      return Promise.all(promArray)
    })
    .then(function(results){
      return results.filter(function(r){ return r; })[0];
    })
    .catch(function(){
      console.log("failing");
    });
  });
};

// Testing
// filepathExists("public/favicon.ico")
// .then(function(filepath){
//   console.log("Found file at", filepath)
// })
// .catch(function(err){
//   console.log("ERROR: ",err);
// });
findFileInDirectory("","favicon.ico")
.then(function(result){
  console.log(result? `Location: ${result}` : "Not Found");
})

module.exports = FileLoader;
