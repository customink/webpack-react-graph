# webpack-react-graph

This is a script I threw together as a webpack plugin to create a graph visualization of our app's React component 
hierarchy. It uses vis.js to render the graph.

# Usage

```javascript
var ReactGraphPlugin = require('webpack-react-graph');

// var "plugins" defined

plugins.push(new ReactGraphPlugin({
  root: 'App',
  components: 'components/',
  actions: 'actions/',
  stores: 'stores/',
  target: 'graph/'
}));

// var "plugins" passed into webpack config
```

The values for the options shown in the example above are the default values.

### root

This is the name of the app's root React component. (Note: This is the name as requested in webpack, i.e., the value
that goes into the `require` statement. Assuming your filenames and your React component names match, there shouldn't
be any confusion here.)

### components

This is the directory that contains the files that define the app's React components.

### actions

For Flux apps, this is the directory the contains the files that contain the app's action creators. This is used to
highlight with a different color components that dispatch actions.

### stores

For Flux apps, this is the directory the contains the files that contain the app's action creators. This is used to
highlight with a different color components that access stores. (Note: This is just used to check if the request for
webpack module contains a substring, which can be exploited for apps that don't contain a directory for stores. For
instance, providing the string `react-redux` for a Redux app highlights the components that use the react-redux
connect helper to connect to the store.)

### target

This is the location that built HTML, CSS, and JavaScript for the graph will be written. To avoid including the graph
in the distributable of an app's webpack build, use a path such as `../graph`.


# TODO

It needs tests!
