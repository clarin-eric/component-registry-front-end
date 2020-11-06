'use strict';

var log = require('loglevel');

var React = require('react');
var ReactDOM = require('react-dom');

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
var changeObj = require('../../util/ImmutabilityUtil').changeObj;

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

  componentDidUpdate: function(prevProps) {
    if(this.props.otherAttributes !== prevProps.otherAttributes) {
      log.debug('reset new cue name');
      this.setState({newCueName: ''});
    }
  },

  getInitialState: function() {
    return {
      newCueName: ''
    };
  },

  addCue: function(nameInput) {
    var newCueName = this.state.newCueName;
    if (newCueName === null || newCueName === '') {
      //TODO: validate properly!
      log.warn('No new cue name provided');
    } else {
      log.debug("Add cue with name ", newCueName);
      var newCueAttribute = '@cue:' + newCueName;
      var change = changeObj(newCueAttribute, '');

      var otherAttributes = this.props.otherAttributes;
      if($.isPlainObject(otherAttributes)) {
        if(otherAttributes.hasOwnProperty(newCueAttribute)) {
          log.error("Cannot add property, already exists: ", newCueAttribute);
        } else {
          this.props.onChange(update(otherAttributes, {$merge: change}));
        }
      } else {
        this.props.onChange(change);
      }
    }
  },

  onCueChange: function(key, e) {
    var value = e.target.value;
    log.debug("Change value for key ", key, " to ", value);
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
                  <div key={idx}>
                    <span>{key}</span>
                    <Input type="text" value={value} onChange={this.onCueChange.bind(this, key)} />
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
                  {(!this.props.otherAttributes || this.props.otherAttributes.length == 0) ? <span>Create a cue</span> : <span>Add a cue</span>}
                    <Input type="text" value={this.state.newCueName} onChange={e=>{this.setState({newCueName: e.target.value});}} />
                    <a onClick={this.addCue}>
                      <Glyphicon glyph="plus" />
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
