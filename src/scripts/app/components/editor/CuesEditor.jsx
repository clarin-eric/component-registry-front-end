'use strict';

var log = require('loglevel');
var _ = require('lodash');

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

const cueAttributeExpr = /^[A-Za-z][A-Za-z\d-]*_[A-Za-z\d-]+$/; // e.g. test-123_Abc-123

/**
 * CuesEditor
 * @type {[type]}
 */
var CuesEditor = React.createClass({
  mixins: [ImmutableRenderMixin, CmdiVersionModeMixin],

  propTypes: {
    otherAttributes: React.PropTypes.object,
    onChange: React.PropTypes.func.isRequired,
    validate: React.PropTypes.func.isRequired
  },

  componentDidUpdate: function(prevProps) {
    if(this.props.otherAttributes !== prevProps.otherAttributes) {
      log.debug('reset new cue name');
      this.setState({newCueName: '', addCueMode: false});
    }
  },

  getInitialState: function() {
    return {
      newCueName: '',
      addCueMode: false
    };
  },

  toggleAddCue: function() {
    this.setState({addCueMode: !this.state.addCueMode});
  },

  addCue: function(nameInput) {
    var newCueName = this.state.newCueName;
    if (!this.validateNewCueAttribute(newCueName)) {
      log.warn('No new cue name provided');
    } else {
      log.debug("Add cue with name ", newCueName);
      var newCueAttribute = 'cue:' + newCueName;
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
    //TODO: validate value!
    log.debug("Change value for key ", key, " to ", value);
    var change = changeObj(key, value);
    this.props.onChange(update(this.props.otherAttributes, {$merge: change}));
  },

  deleteCue: function(key, e) {
    log.debug("Delete ", key);

    this.props.onChange(_.omit(this.props.otherAttributes, [key]));
  },

  validateNewCueAttribute: function(val, targetName, feedback) {
    log.debug('validateNewCueAttribute', val, targetName, feedback);

    if(val != null && cueAttributeExpr.test(val)) {
      var newCueAttribute = 'cue:' + val;
      if($.isPlainObject(this.props.otherAttributes) && this.props.otherAttributes.hasOwnProperty(newCueAttribute)) {
        if(feedback != undefined) {
          feedback('Cue attribute name already used');
        }
      } else {
        return true;
      }
    } else {
      if(feedback != undefined) {
        feedback('Not a valid attribute name');
      }
      return false;
    }
  },

  validateCueValue: function(val, targetName, feedback) {
    if(val != null && val !== '') {
      return true;
    } else {
      if(feedback != undefined) {
        feedback('Cue attribute value cannot be empty');
      }
      return false;
    }
  },

  render: function () {
    return (
      <div className="cues-form">
          <label className="control-label editorFormLabel">Cues for tools</label>

          <div className="form-groups">
            {$.isPlainObject(this.props.otherAttributes) &&
              _.toPairs(this.props.otherAttributes).map(function(pair, idx) {
                var key = pair[0];
                var value = pair[1];
                return (
                  <div className="form-inline" key={idx}>
                      <Input type="text" value={key} disabled={true} />
                      <ValidatingTextInput name="cueValue" type="text"
                        value={value}
                        disabled={!this.isCmdi12Mode()}
                        onChange={this.onCueChange.bind(this, key)}
                        addonAfter={<a className="delete" onClick={this.deleteCue.bind(this, key)}><Glyphicon glyph="trash"/></a>}
                        validate={this.validateCueValue} />
                  </div>
                );
              }.bind(this))
            }
            <div className="add-cue-form">
              {this.isCmdi12Mode() ?
                <div className="form-inline additional-cue">
                {!this.state.addCueMode &&
                  <div className="additional-cue">
                      <a onClick={this.toggleAddCue}>
                        {(!this.props.otherAttributes || this.props.otherAttributes.length == 0) ? <span>Create a cue</span> : <span>Add a cue</span>} <Glyphicon glyph="plus" />
                      </a>
                  </div>


                }
                {this.state.addCueMode &&
                  <div>
                    <ValidatingTextInput name="newCueName" type="text"
                      label="cue:"
                      value={this.state.newCueName}
                      onChange={e=>{this.setState({newCueName: e.target.value});}}
                      validate={this.validateNewCueAttribute} />
                    <div className="form-group">
                      <a onClick={this.addCue} title="add"><Glyphicon glyph="ok" /></a>
                      &nbsp;
                      <a onClick={this.toggleAddCue} title="add"><Glyphicon glyph="remove" /></a>
                    </div>
                    <p className="help-block">
                      Cue names must be <em>prefixed</em> with a string of alphanumeric characters, followed by an underscore: <tt>[prefix]_[name]</tt>.
                      Please choose a sufficiently unique prefix and use it consistently within the chosen context.
                    </p>
                  </div>
                }
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
