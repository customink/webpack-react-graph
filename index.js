var fs = require('fs');
var path = require('path');

var VIS_PATH = path.join(__dirname, 'node_modules', 'vis', 'dist');
var VIS_FILENAME = 'vis.min.js';
var VIS_CSS_FILENAME = 'vis.min.css';
var HTML_FILENAME = 'index.html';
var REPLACEMENT_STRING = '<!-- webpack-react-graph -->';
var COLORS = {
  ORANGE: '#f37321',
  RED: '#ee3524',
  BROWN: '#54301a',
  BLUE: '#10a6df'
};

function findModule(compilation, rawRequest) {
  return compilation.modules.find(function(module) {
    return module.rawRequest === rawRequest;
  });
}

function assetDescriptionFromFile(file, script) {
  var buffer = fs.readFileSync(file);
  var description = {
    source: function() {
      return buffer.toString('ascii');
    },
    size: function() {
      return buffer.length;
    }
  };
  if (typeof script !== 'undefined') {
    description.source = function() {
      return buffer.toString('ascii').replace(REPLACEMENT_STRING, script);
    };
  }
  return description;
}

function requestHasSubstring(module, substring) {
  return typeof module.request !== 'undefined' && module.request.indexOf(substring) > -1;
}

function ReactGraphPlugin(options) {
  this.componentsDirectory = options.components || 'components/';
  this.rootComponent = options.root || 'App';
  this.actionsDirectory = options.actions || 'actions/';
  this.storesDirectory = options.stores || 'stores/';
  this.targetDirectory = options.target || 'graph';
  this.components = {};
}

ReactGraphPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, callback) {
    this.processModule(findModule(compilation, path.join(this.componentsDirectory, this.rootComponent)));
    compilation.assets[path.join(this.targetDirectory, VIS_FILENAME)] = assetDescriptionFromFile(path.join(VIS_PATH, VIS_FILENAME));
    compilation.assets[path.join(this.targetDirectory, VIS_CSS_FILENAME)] = assetDescriptionFromFile(path.join(VIS_PATH, VIS_CSS_FILENAME));
    compilation.assets[path.join(this.targetDirectory, HTML_FILENAME)] = assetDescriptionFromFile(path.join(__dirname, HTML_FILENAME), this.inlinedScript());
    callback();
  }.bind(this));
};

ReactGraphPlugin.prototype.processModule = function(module) {
  if (typeof this.components[this.componentName(module)] === 'undefined') {
    this.components[this.componentName(module)] = {
      dispatchesActions: this.checkForActions(module),
      connectsToStore: this.checkForStoreConnection(module),
      children: []
    };
    module.dependencies.forEach(function(dependency) {
      if (requestHasSubstring(dependency, this.componentsDirectory)) {
        this.components[this.componentName(module)].children.push(this.componentName(dependency.module));
        this.processModule(dependency.module);
      }
    }.bind(this));
  }
};

ReactGraphPlugin.prototype.componentName = function(module) {
  return module.rawRequest.replace(this.componentsDirectory, '');
};

ReactGraphPlugin.prototype.checkForActions = function(module) {
  return module.dependencies.some(function(dependency) {
    return requestHasSubstring(dependency, this.actionsDirectory);
  }.bind(this));
};

ReactGraphPlugin.prototype.checkForStoreConnection = function(module) {
  return module.dependencies.some(function(dependency) {
    return requestHasSubstring(dependency, this.storesDirectory);
  }.bind(this));
};

ReactGraphPlugin.prototype.inlinedScript = function() {
  if (typeof this.graph === 'undefined') {
    this.generateGraph();
  }
  return 'var nodes = ' + JSON.stringify(this.graph.nodes) + '; var edges = ' + JSON.stringify(this.graph.edges) + ';';
};

ReactGraphPlugin.prototype.generateGraph = function() {
  this.graph = {
    nodes: [],
    edges: []
  };
  this.generateGraphNode(this.rootComponent, 0, 0);
};

ReactGraphPlugin.prototype.generateGraphNode = function(componentName) {
  var component = this.components[componentName];
  var node = {
    id: this.graph.nodes.length,
    label: componentName,
    color: COLORS.BLUE
  };
  if (component.dispatchesActions && component.connectsToStore) {
    node.color = COLORS.BROWN;
  } else if (component.dispatchesActions) {
    node.color = COLORS.ORANGE;
  } else if (component.connectsToStore) {
    node.color = COLORS.RED;
  }
  this.graph.nodes.push(node);
  component.children.forEach(function(childName) {
    var child = this.generateGraphNode(childName);
    this.graph.edges.push({
      from: node.id,
      to: child.id
    });
  }.bind(this));
  return node;
};

module.exports = ReactGraphPlugin;
