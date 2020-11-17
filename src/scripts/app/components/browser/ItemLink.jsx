'use strict';
var log = require('loglevel');

var React = require("react"),
    Fluxxor = require("fluxxor");

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin'),
    FluxMixin = Fluxxor.FluxMixin(React);

/**
*
*
* @constructor
*/
var ItemLink = React.createClass({
  mixins: [FluxMixin, ImmutableRenderMixin],

  propTypes: {
    itemId: React.PropTypes.string.isRequired,
    type: React.PropTypes.string.isRequired
  },

  handleClick: function() {
    var type = this.props.type;
    var id = this.props.itemId;

    log.debug("Jumping to", type, this.props.itemId);

    this.getFlux().actions.jumpToItem(type, id);
    this.getFlux().actions.loadItem(type, id);
    this.getFlux().actions.loadComponentSpec(type, id);
  },

  render: function() {
    var {itemId, ...otherProps} = this.props;
    return <a onClick={this.handleClick} {...otherProps}>{this.props.children}</a>
  }
});

module.exports = ItemLink;
