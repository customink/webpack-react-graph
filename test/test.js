var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
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

chai.use(sinonChai);

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

describe('ReactGraphPlugin', function() {
  describe('#generateGraph', function() {
    beforeEach(function() {
      this.plugin = new ReactGraphPlugin({});
      this.plugin.generateGraphNode = sinon.spy();
    });

    it('initializes the graph object', function() {
      expect(this.plugin.graph).is.undefined;
      this.plugin.generateGraph();
      expect(this.plugin.graph).to.deep.equal({ nodes: [], edges: [] });
    });

    it('calls generateGraphNode on the root component', function() {
      var dummy = 'rootComponent';
      this.plugin.rootComponent = dummy;
      this.plugin.generateGraph();
      expect(this.plugin.generateGraphNode).to.have.been.calledWith(dummy, 0, 0);
    });
  });

  describe('#generateGraphNode', function() {
    before(function() {
      this.plugin = new ReactGraphPlugin({});
      this.plugin.components = {
        App: {
          dispatchesActions: false,
          connectsToStore: true,
          children: ['Header', 'Body', 'Footer']
        },
        Header: {
          dispatchesActions: false,
          connectsToStore: false,
          children: []
        },
        Footer: {
          dispatchesActions: false,
          connectsToStore: false,
          children: []
        },
        Body: {
          dispatchesActions: false,
          connectsToStore: false,
          children: ['Section', 'Panel']
        },
        Section: {
          dispatchesActions: true,
          connectsToStore: true,
          children: []
        },
        Panel: {
          dispatchesActions: true,
          connectsToStore: false,
          children: []
        },
      };
    });

    beforeEach(function() {
      this.plugin.graph = {
        nodes: [],
        edges: []
      };
    });

    it('recursively calls self on the children of the component', function() {
      this.plugin.generateGraphNode = sinon.spy(this.plugin.generateGraphNode);
      this.plugin.generateGraphNode('Body');
      expect(this.plugin.generateGraphNode).to.be.calledWith('Section');
      expect(this.plugin.generateGraphNode).to.be.calledWith('Panel');
    });

    it('generates a node entry', function() {
      this.plugin.generateGraphNode('Body');
      expect(this.plugin.graph.nodes[0].id).to.equal(0);
      expect(this.plugin.graph.nodes[0].label).to.equal('Body');
    });

    it('returns the node entry', function() {
      var returnValue = this.plugin.generateGraphNode('Body');
      expect(returnValue.id).to.equal(0);
      expect(returnValue.label).to.equal('Body');
    });

    it('generates edge entries to the children of the component', function() {
      this.plugin.generateGraphNode('Body');
      expect(this.plugin.graph.edges[0]).to.deep.equal({ from: 0, to: 1 });
      expect(this.plugin.graph.edges[1]).to.deep.equal({ from: 0, to: 2 });
    });

    it('sets components that neither dispatch actions nor connect to store to blue', function() {
      var node = this.plugin.generateGraphNode('Footer');
      expect(node.color).to.equal('#10a6df');
    });

    it('sets components that dispatch actions, but do not connect to store to orange', function() {
      var node = this.plugin.generateGraphNode('Panel');
      expect(node.color).to.equal('#f37321');
    });

    it('sets components that do not dispatch actions, but connect to store to red', function() {
      var node = this.plugin.generateGraphNode('App');
      expect(node.color).to.equal('#ee3524');
    });

    it('sets components that dispatch actions and connect to store to brown', function() {
      var node = this.plugin.generateGraphNode('Section');
      expect(node.color).to.equal('#54301a');
    });
  });
});
