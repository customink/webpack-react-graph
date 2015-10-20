var assert = require('assert');
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var ReactGraphPlugin = require('../index.js');

var FIXTURES_PATH = path.join(__dirname, 'fixtures');
var BUNDLE_PATH = path.join(FIXTURES_PATH, 'bundle.js');
var WEBPACK_CONFIG = {
  entry: path.join(FIXTURES_PATH, 'App.js'),
  output: {
    path: FIXTURES_PATH,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      }
    ]
  }
}

function fileExists(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    } else {
      throw err;
    }
  }
}

function removeFileIfExists(path) {
  if (fileExists(path)) {
    fs.unlinkSync(path);
  }
}

describe('The bundle.js', function() {
  it('is built', function(done) {
    var compiler = webpack(WEBPACK_CONFIG);
    removeFileIfExists(BUNDLE_PATH);
    compiler.run(function(err, stats) {
      if (err) throw err;
      assert(fileExists(BUNDLE_PATH));
      removeFileIfExists(BUNDLE_PATH);
      done();
    });
  });
});
