var expect = require('chai').expect;
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
  },
  plugins: [ new ReactGraphPlugin({ legend: true }) ],
};

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

describe('A build', function() {
  before(function() {
    this.compiler = webpack(WEBPACK_CONFIG);
  });

  beforeEach(function() {
    removeFileIfExists(BUNDLE_PATH);
    removeDirIfExists(GRAPH_PATH);
  });

  it('generates the bundle.js', function(done) {
    this.compiler.run(function(err, stats) {
      if (err) throw err;
      expect(fileExists(BUNDLE_PATH)).to.be.true;
      done();
    });
  });

  it('generates the graph directory and its contents', function(done) {
    this.compiler.run(function(err, stats) {
      if (err) throw err;
      expect(dirExists(GRAPH_PATH)).to.be.true;
      expect(fileExists(path.join(GRAPH_PATH, 'index.html'))).to.be.true;
      expect(fileExists(path.join(GRAPH_PATH, 'vis.min.js'))).to.be.true;
      expect(fileExists(path.join(GRAPH_PATH, 'vis.min.css'))).to.be.true;
      done();
    });
  });
});
