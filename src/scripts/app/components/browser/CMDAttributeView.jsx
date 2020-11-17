'use strict';

var React = require('react');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//components
var ValueScheme = require('../ValueScheme');
var DocumentationView = require('./DocumentationView');
var CuesView = require('./CuesView');
var AutoValuesView = require('./AutoValuesView');

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
    var conceptLink = attr.ConceptLink;
    var documentation = attr.Documentation;
    var required = attr['@Required'] === 'true';
    return (
      <div className="panel panel-success">
        <div className="panel-heading">
          <span>Attribute: </span>
          <span className="elementName">{attr['@name']}</span>
        </div>
        <div className="panel-body">
          <div className="valueScheme">
            <span className="attrLabel">Value scheme:</span>
            <span className="attrValue">{attr_val}</span>
          </div>
          <ul className="attrAttrs">
            {(conceptLink != null && conceptLink !== "") && (
              <li className="attrElem">
                <span className="attrLabel">ConceptLink:</span>
                <span className="attrValue"><a href={conceptLink} target="_blank">{conceptLink}</a></span>
              </li>
            )}
            {$.isArray(documentation) && documentation.length > 0 && documentation[0]['$'] != null && documentation[0]['$'] != '' && (
              <li className="attrElem"><span className="attrLabel">Documentation:</span>
              {
                <DocumentationView value={documentation} />
              }
              </li>
            )}
            <li className="attrElem">
              <span className="attrLabel">Required:</span>
              <span className="attrValue">{required ? "Yes":"No"}</span>
            </li>

            <AutoValuesView item={attr} />

            <CuesView item={attr} />

          </ul>
        </div>
      </div>
    );
  }
});

module.exports = CMDAttributeView;
