var assert = require('assert');
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var ReactGraphPlugin = require('../index.js');

var FIXTURES_PATH = path.join(__dirname, 'fixtures');
var BUNDLE_PATH = path.join(FIXTURES_PATH, 'bundle.js');
var GRAPH_PATH = path.join(__dirname, 'fixtures', 'graph');
var WEBPACK_CONFIG = {
  entry: path.join(FIXTURES_PATH, 'App.js'),
  output: {
    path: FIXTURES_PATH,
    filename: 'bundle.js'
  },
  debug: true,
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      }
    ]
  }
};
var PLUGIN_CONFIG = Object.create(WEBPACK_CONFIG, {
  plugins: {
    value: [ new ReactGraphPlugin({
      components: '.'
    }) ],
    writable: true
  }
});

function fileExists(arg) {
  try {
    return fs.statSync(arg).isFile();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    } else {
      throw err;
    }
  }
}

function removeFileIfExists(arg) {
  if (fileExists(arg)) {
    fs.unlinkSync(arg);
  }
}

function dirExists(arg) {
  try {
    return fs.statSync(arg).isDirectory();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    } else {
      throw err;
    }
  }
}

function removeDirIfExists(arg) {
  if (dirExists(arg)) {
    rimraf.sync(arg);
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

describe('Graph files', function() {
  it('are generated', function(done) {
    var compiler = webpack(PLUGIN_CONFIG);
    removeDirIfExists(GRAPH_PATH);
    compiler.run(function(err, stats) {
      if (err) throw err;
      assert(dirExists(GRAPH_PATH));
      done();
    });
  });
});
