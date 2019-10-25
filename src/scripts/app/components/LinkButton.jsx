'use strict';

var React = require('react');

//bootstrap
var Button = require('react-bootstrap/lib/Button');

/**
* LinkButton
* @constructor
*/
var LinkButton = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  
  navigate: function() {
    this.context.router.push(this.props.to);
  },

  render: function() {
    var {to, onClick, ...other} = this.props;
    return (
      <Button onClick={this.navigate} {...other}>
        {this.props.children}
      </Button>
    );
  }
});

module.exports = LinkButton;
