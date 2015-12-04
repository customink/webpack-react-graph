var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var fs = require('fs');
var path = require('path');
var ReactGraphPlugin = require('../index.js');

chai.use(sinonChai);

describe('ReactGraphPlugin', function() {
  describe('#emitHandler', function() {
    before(function() {
      this.plugin = new ReactGraphPlugin({});
    });

    beforeEach(function() {
      this.rootComponent = {};
      this.plugin.findComponent = sinon.spy(function () {
        return this.rootComponent;
      }.bind(this));
      this.plugin.processComponent = sinon.spy();
      this.plugin.inlinedScript = sinon.spy();
      this.compilation = { assets: {} };
      this.callback = sinon.spy();
    });

    it('calls the compiler callback', function() {
      this.plugin.emitHandler(this.compilation, this.callback);
      expect(this.callback).to.have.been.called;
    });

    it('finds the root component and calls #processComponent with it', function() {
      this.plugin.emitHandler(this.compilation, this.callback);
      expect(this.plugin.findComponent).to.have.been.called;
      expect(this.plugin.processComponent).to.have.been.calledWith(this.rootComponent);
    });

    it('throws an error when no root component is found', function() {
      this.plugin.findComponent = sinon.spy(function() {
        return null;
      });
      expect(function() {
        this.plugin.emitHandler(this.compilation, this.callback);
      }.bind(this)).to.throw(ReferenceError);
    });

    it('adds to the assets object in the compilation', function() {
      this.plugin.emitHandler(this.compilation, this.callback);
      expect(this.compilation.assets['graph/vis.min.js']).to.exist;
      expect(this.compilation.assets['graph/vis.min.css']).to.exist;
      expect(this.compilation.assets['graph/index.html']).to.exist;
    });

    it('writes to stderr when the compilation object has errors', function() {
      var stackMessage1 = 'stack message 1';
      var stackMessage2 = 'stack message 2';
      console.error = sinon.spy();
      this.compilation.errors = [ { stack: stackMessage1 }, { stack: stackMessage2 } ];
      this.plugin.emitHandler(this.compilation, this.callback);
      expect(console.error).to.have.been.calledWith(stackMessage1);
      expect(console.error).to.have.been.calledWith(stackMessage2);
    });
  });

  describe('#componentName', function() {
    before(function() {
      this.plugin = new ReactGraphPlugin({});
    });

    beforeEach(function() {
      this.module = { _source: {} };
    });

    it('returns the displayName if present with the #createClass syntax', function() {
      this.module._source._value = fs.readFileSync(path.join(__dirname, 'fixtures', 'App.js'));
      expect(this.plugin.componentName(this.module)).to.equal('App');
    });

    it('returns the displayName if present with the ES2015 class syntax', function() {
      this.module._source._value = fs.readFileSync(path.join(__dirname, 'fixtures', 'App', 'class-syntax-with-displayName.js'));
      expect(this.plugin.componentName(this.module)).to.equal('App');
    });

    it('returns the class name of the component if present', function() {
      this.module._source._value = fs.readFileSync(path.join(__dirname, 'fixtures', 'App', 'class-syntax.js'));
      expect(this.plugin.componentName(this.module)).to.equal('App');
    });

    it('returns the name of the variable to which the component is assigned if present', function() {
      this.module._source._value = fs.readFileSync(path.join(__dirname, 'fixtures', 'App', 'variable-name.js'));
      expect(this.plugin.componentName(this.module)).to.equal('App');
    });

    it('returns null when the source is not for a React component', function() {
      this.module._source._value = fs.readFileSync(path.join(__dirname, '..', 'index.js'));
      expect(this.plugin.componentName(this.module)).to.be.null;
    });

    it('returns null when there is no source', function() {
      delete this.module['_source'];
      expect(this.plugin.componentName(this.module)).to.be.null;
    });
  });

  describe('#findComponent', function() {
    before(function() {
      this.plugin = new ReactGraphPlugin({});
      this.sectionModule = {
        _source:
        {
          _value: fs.readFileSync(path.join(__dirname, 'fixtures', 'Section.js'))
        }
      };
      this.compilation = {
        modules: [
          { _source:
            {
              _value: fs.readFileSync(path.join(__dirname, 'fixtures', 'Body.js'))
            }
          },
          this.sectionModule,
          { _source:
            {
              _value: fs.readFileSync(path.join(__dirname, 'fixtures', 'Panel.js'))
            }
          }
        ]
      };
    });

    it('returns the module entry for a component', function() {
      expect(this.plugin.findComponent(this.compilation, 'Section')).to.equal(this.sectionModule);
    });

    it('returns null when there is no such component in the modules', function() {
      expect(this.plugin.findComponent(this.compilation, 'Foobar')).to.be.null;
    });
  });

  describe('#inlinedScript', function() {
    beforeEach(function() {
      this.plugin = new ReactGraphPlugin({ legend: true });
    });

    it('calls #generateGraph and #addLegendToGraph when the graph data are undefined', function() {
      this.plugin.generateGraph = sinon.spy(function() {
        this.graph = {};
      }.bind(this.plugin));
      this.plugin.addLegendToGraph = sinon.spy();
      this.plugin.inlinedScript();
      expect(this.plugin.generateGraph).to.have.been.called;
      expect(this.plugin.addLegendToGraph).to.have.been.called;
    });

    it('returns a stringified version of the graph data', function() {
      var graphData = {
        nodes: [
          {id: 0, label: 'App', color: '#10a6df'},
          {id: 1, label: 'Header', color: '#10a6df'},
          {id: 2, label: 'Body', color: '#10a6df'},
          {id: 3, label: 'Panel', color: '#10a6df'},
          {id: 4, label: 'Section', color: '#10a6df'},
          {id: 5, label: 'Footer ', color: '#10a6df'}
        ],
        edges: [
          {from: 0, to: 1},
          {from: 2, to: 3},
          {from: 2, to: 4},
          {from: 0, to: 2},
          {from: 0, to: 5}
        ]
      };
      this.plugin.generateGraph = sinon.spy(function() {
        this.graph = graphData;
      }.bind(this.plugin));
      expect(this.plugin.inlinedScript()).to.equal('var nodes = ' +
          JSON.stringify(graphData.nodes) + '; var edges = ' +
          JSON.stringify(graphData.edges) + ';');
    });
  });

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
