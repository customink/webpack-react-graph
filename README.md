# webpack-react-graph

This is a script I threw together as a webpack plugin to create a graph
visualization of our application's React component hierarchy. It uses vis.js to
render the graph.

# Usage

```javascript
var ReactGraphPlugin = require('webpack-react-graph');

// var "plugins" defined

plugins.push(new ReactGraphPlugin({
  root: 'App',
  actions: 'actions/',
  stores: 'stores/',
  target: 'graph/',
  legend: false
}));

// var "plugins" passed into webpack config
```

The values for the options shown in the example above are the default values.

### root

This is the name of the application's root React component. Component names are
parsed from displayName parameters if they exist. Otherwise they are parsed
from variable or class names of the component.

### actions

For Flux applications, this is a request path substring that denotes the
file(s) that contain(s) the application's action creator(s). This is used to
highlight components that dispatch actions with a different color. If any
dependency of a component has a substring that matches this parameter, the
component is considered to be dispatching actions.

### stores

For Flux applications, this is a request path substring that denotes the
file(s) that contain(s) the application's store(s). This is used to highlight
components that access central state with a different color. If any dependency
of a component has a substring that matches this parameter, the component is
considered to be accessing central state.

### target

This is the location that built HTML, CSS, and JavaScript for the graph will be
written. To avoid including the graph in the distributable of an application's
webpack build, use a path such as `../graph`.

### legend

When this is set to true, four nodes are added to the generated graph. Each is
of a different color, with a label that gives a shorthand for the highlight
color indicates


# TODO

1. Add release notes.
2. Write unit tests for remaining untested functions.
3. Make the options for rendering the graph configurable.
