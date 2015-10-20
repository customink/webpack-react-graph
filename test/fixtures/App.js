var React = require('react');
var Header = require('./Header');
var Body = require('./Body');
var Footer = require('./Footer');

module.export = React.createClass({
  displayName: 'App',
  propTypes: {},
  render: function() {
    return <div>
      <Header />
      <Body />
      <Footer />
    </div>;
  }
});
