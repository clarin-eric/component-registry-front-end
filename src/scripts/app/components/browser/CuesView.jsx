'use strict';
var React = require("react");

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

/**
*
* @constructor
* @mixes ImmutableRenderMixin
*/
var CuesView = React.createClass({
  mixins: [ImmutableRenderMixin],

  propTypes: {
    item: React.PropTypes.object.isRequired
  },

  render: function() {
    var cues =
      _(_.get(this.props.item, 'otherAttributes', {}))
      .toPairs()
      .filter(function(p) {
        //p[0] is attribute name, p[1] is attribute value
        return _.startsWith(p[0], 'cue:');
      });

    return !cues.isEmpty() && (
      <li className="attrElem">
        <div className="attrLabel">Cues for tools:</div>
        <div className="attrValue"><pre>{cues.map(function(pair){
           var attr = pair[0];
           var value = pair[1];
            return <div key={"cue-"+attr}>@{attr}="{value}"</div>;
          }).value()}</pre></div>
      </li>
    );
  }
});

module.exports = CuesView;
