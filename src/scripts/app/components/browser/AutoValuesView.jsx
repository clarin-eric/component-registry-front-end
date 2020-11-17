'use strict';
var React = require("react");

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

/**
*
* @constructor
* @mixes ImmutableRenderMixin
*/
var AutoValuesView = React.createClass({
  mixins: [ImmutableRenderMixin],

  propTypes: {
    item: React.PropTypes.object.isRequired
  },

  render: function() {
    return $.isArray(this.props.item.AutoValue) && (
        <li className="attrElem">
          <div className="attrLabel">Automatic value expression(s):</div>
          <div className="attrValue"><pre>{this.props.item.AutoValue.map(function(value, idx){
              return <div key={"autoValue-"+idx}>{value}</div>;
            })}</pre></div>
        </li>
      );
  }
});

module.exports = AutoValuesView;
