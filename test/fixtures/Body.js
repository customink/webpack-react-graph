var React = require('react');
var Panel = require('./Panel');
var Section = require('./Section');

module.export = React.createClass({
  displayName: 'Body',
  propTypes: {},
  render: function() {
    return <div>
      <Panel />
      <Section />
    </div>;
  }
});
