var fs = require('fs');
var path = require('path');

var VIS = path.parse(require.resolve('vis'));
var VIS_PATH = VIS.dir;
var VIS_FILENAME = VIS.base;
var VIS_CSS_FILENAME = VIS.name + '.css';
var HTML_FILENAME = 'index.html';
var REPLACEMENT_STRING = '<!-- webpack-react-graph -->';
var COLORS = {
  ORANGE: '#f37321',
  RED: '#ee3524',
  BROWN: '#54301a',
  BLUE: '#10a6df'
};

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
  this.rootComponent = options.root || 'App';
  this.actionsDirectory = options.actions || 'actions/';
  this.storesDirectory = options.stores || 'stores/';
  this.targetDirectory = options.target || 'graph';
  this.generateLegend = options.legend || false;
  this.components = {};
}

ReactGraphPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', this.emitHandler.bind(this));
};

ReactGraphPlugin.prototype.emitHandler = function(compilation, callback) {
  var rootComponent;
  if (compilation['errors'] && compilation['errors'].length > 0) {
    compilation['errors'].forEach(function(error) {
      console.error(error.stack);
    });
    console.error('=======================================');
    console.error(' COMPILATION ERRORS. SEE ABOVE. ');
    console.error('=======================================');
  }
  rootComponent = this.findComponent(compilation, this.rootComponent);
  if (rootComponent === null) {
    throw new ReferenceError('Root component not found. No component with name "' +
        this.rootComponent + '"');
  }
  this.processComponent(rootComponent);
  compilation.assets[path.join(this.targetDirectory, VIS_FILENAME)] = assetDescriptionFromFile(path.join(VIS_PATH, VIS_FILENAME));
  compilation.assets[path.join(this.targetDirectory, VIS_CSS_FILENAME)] = assetDescriptionFromFile(path.join(VIS_PATH, VIS_CSS_FILENAME));
  compilation.assets[path.join(this.targetDirectory, HTML_FILENAME)] = assetDescriptionFromFile(path.join(__dirname, HTML_FILENAME), this.inlinedScript());
  callback();
};

ReactGraphPlugin.prototype.processComponent = function(module) {
  var componentName = this.componentName(module);
  if (typeof this.components[componentName] === 'undefined') {
    this.components[this.componentName(module)] = {
      dispatchesActions: this.checkForActions(module),
      connectsToStore: this.checkForStoreConnection(module),
      children: []
    };
    module.dependencies.forEach(function(dependency) {
      var dependencyName;
      if (dependency.module !== null) {
        dependencyName = this.componentName(dependency.module);
        if (dependencyName != null) {
          this.components[componentName].children.push(this.componentName(dependency.module));
          this.processComponent(dependency.module);
        }
      }
    }.bind(this));
  }
};

ReactGraphPlugin.prototype.componentName = function(module) {
  var source;
  var displayNameResult;
  var classNameResult;
  var variableNameResult;
  if (module._source === undefined || module._source === null) {
    return null;
  }
  source = module._source._value;
  displayNameResult = /displayName\s*[:=]\s*['"](.+)['"]/.exec(source);
  classNameResult = /class\s+(\w+)\s+extends\s+Component/.exec(source);
  variableNameResult = /var\s+(\w+)\s+=\s+React.createClass/.exec(source);
  if (displayNameResult !== null) {
    return displayNameResult[1];
  } else if (classNameResult !== null) {
    return classNameResult[1];
  } else if (variableNameResult !== null) {
    return variableNameResult[1];
  } else {
    return null;
  }
};

ReactGraphPlugin.prototype.findComponent = function(compilation, name) {
  var i;
  var module;
  for (i = 0; i < compilation.modules.length; i++) {
    module = compilation.modules[i];
    if (this.componentName(module) === name) {
      return module;
    }
  }
  return null;
}

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
    if (this.generateLegend) {
      this.addLegendToGraph();
    }
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
    color: COLORS.BLUE,
    group: 0
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

ReactGraphPlugin.prototype.addLegendToGraph = function() {
  var brownNodeId = this.addLegendNodeToGraph(COLORS.BROWN, 'Store and Actions');
  var redNodeId = this.addLegendNodeToGraph(COLORS.RED, 'Store');
  var orangeNodeId = this.addLegendNodeToGraph(COLORS.ORANGE, 'Actions');
  var blueNodeId = this.addLegendNodeToGraph(COLORS.BLUE, 'Pure');
};

ReactGraphPlugin.prototype.addLegendNodeToGraph = function(color, label) {
  var id = this.graph.nodes.length;
  this.graph.nodes.push({
    id: id,
    label: label,
    color: color,
    shape: 'box',
    group: 1
  });
  return id;
};

module.exports = ReactGraphPlugin;
