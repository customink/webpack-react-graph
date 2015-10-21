var assert = require('chai').assert;
var sinon = require('sinon');
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
  plugins: [ new ReactGraphPlugin({ components: '.' }) ],
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
      assert(fileExists(BUNDLE_PATH));
      done();
    });
  });

  it('generates the graph directory and its contents', function(done) {
    this.compiler.run(function(err, stats) {
      if (err) throw err;
      assert(dirExists(GRAPH_PATH));
      assert(fileExists(path.join(GRAPH_PATH, 'index.html')));
      assert(fileExists(path.join(GRAPH_PATH, 'vis.min.js')));
      assert(fileExists(path.join(GRAPH_PATH, 'vis.min.css')));
      done();
    });
  });
});

describe('ReactGraphPlugin', function() {
  describe('#generateGraph', function() {
    beforeEach(function() {
      this.plugin = new ReactGraphPlugin({});
      this.plugin.generateGraphNode = sinon.spy();
    });

    it('initializes the graph object', function() {
      assert.isUndefined(this.plugin.graph);
      this.plugin.generateGraph();
      assert.deepEqual(this.plugin.graph, { nodes: [], edges: [] });
    });

    it('calls generateGraphNode on the root component', function() {
      var dummy = 'rootComponent';
      this.plugin.rootComponent = dummy;
      this.plugin.generateGraph();
      assert(this.plugin.generateGraphNode.calledWith(dummy, 0, 0));
    });
  });
});
