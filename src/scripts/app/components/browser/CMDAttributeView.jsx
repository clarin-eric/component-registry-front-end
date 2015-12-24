'use strict';

var React = require('react');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//components
var ValueScheme = require('../ValueScheme');

//require('../../styles/CMDAttribute.sass');

/**
* CMDAttribute - view display and editing form for a CMDI Attribute item.
* @constructor
* @mixes ImmutableRenderMixin
* @mixes ActionButtonsMixin
*/
var CMDAttributeView = React.createClass({
  mixins: [ImmutableRenderMixin],

  propTypes: {
    spec: React.PropTypes.object.isRequired,
    open: React.PropTypes.bool,
    openAll: React.PropTypes.bool,
    closeAll: React.PropTypes.bool,
    key: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      open: true,
      openAll: false,
      closeAll: false
    };
  },

  render: function () {
    var attr = this.props.spec;
    var attr_val = <ValueScheme obj={attr} enabled={false} />
    return (
      <div className="panel panel-success attrAttr">
        <div className="panel-heading">
          <span>Attribute: </span>
          <span className="elementName">{attr.Name}</span>
        </div>
        <div className="panel-body">
          <div className="valueScheme">Value scheme: {attr_val}</div>
        </div>
      </div>
    );
  }
});

module.exports = CMDAttributeView;
