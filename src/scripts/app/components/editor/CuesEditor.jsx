'use strict';

var log = require('loglevel');
var React = require('react');

//components
var ValidatingTextInput = require('./ValidatingTextInput');

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');
var Input = require('react-bootstrap/lib/Input');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var CmdiVersionModeMixin = require('../../mixins/CmdiVersionModeMixin');

//utils
var update = require('react-addons-update');

/**
 * CuesEditor
 * @type {[type]}
 */
var CuesEditor = React.createClass({
  mixins: [ImmutableRenderMixin, CmdiVersionModeMixin],

  propTypes: {
    otherAttributes: React.PropTypes.object,
    onChange: React.PropTypes.func.isRequired
  },

  // onCueAttributeChange: function(index, e) {
  //   var attributeName = e.target.value;
  //   log.debug('Cue attribute change: ', index, attributeName);
  //
  //   var otherAttributes = {};
  //   otherAttributes['cue:' + attributeName] = 'test';
  //
  //   if(this.props.spec.otherAttributes) {
  //     this.props.onElementChange({$merge: {'otherAttributes': otherAttributes}});
  //   }
  //   //this.props.onElementChange({$merge: changeObj('otherAttributes', otherAttributes)});
  // },
  //
  // onCueValueChange: function(elem, index) {
  //     log.debug('Cue value change: ', index, elem);
  // },
  //
  addCue: function() {

  },

  render: function () {
    return (
      <div className="cues">
          <label className="control-label editorFormLabel">Cues for tools</label>
          <div className="form-groups">
            {$.isPlainObject(this.props.otherAttributes) &&
              _.toPairs(this.props.otherAttributes).map(function(pair, idx) {
                var key = pair[0];
                var value = pair[1];
                return (
                  <div>
                    <span>{key}</span>
                    <Input type="text" value={value} />
                  </div>
                );
                // return (
                //   <ValidatingTextInput key={idx} name="AutoValue" type="text" value={value}
                //     disabled={!this.isCmdi12Mode()}
                //   wrapperClassName="editorFormField" onChange={this.updateAutoValueExpression.bind(this, idx)} validate={this.props.validate}
                //   addonAfter={<a className="delete" onClick={this.removeAutoValueExpression.bind(this, idx)}><Glyphicon glyph="trash"/></a>}
                //   />
                // );
              }.bind(this))
            }
            <div>
              {this.isCmdi12Mode() ?
                <div className="additional-cue">
                    <a onClick={this.addCue}>
                      {(!this.props.otherAttributes || this.props.otherAttributes.length == 0) ? <span>Create a cue</span> : <span>Add a cue</span>} <Glyphicon glyph="plus" />
                    </a>
                </div>
                : <strong>Cues for tools are not supported in CMDI 1.1. Switch to CMDI 1.2 mode to edit.</strong>
              }
            </div>
          </div>
      </div>
    );
  }
});

module.exports = CuesEditor;
