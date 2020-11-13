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
    var cueAttributeExpr = /^[A-z][A-z0-9]*$/;

    if(val != null && cueAttributeExpr.test(val)) {
      var newCueAttribute = 'cue:' + val;
      if(this.props.otherAttributes.hasOwnProperty(newCueAttribute)) {
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
                  <div className="form-inline" key={idx}>
                      <Input type="text" value={key} disabled={true} />
                      <Input type="text" value={value} disabled={!this.isCmdi12Mode()}
                        onChange={this.onCueChange.bind(this, key)}
                        addonAfter={<a className="delete" onClick={this.deleteCue.bind(this, key)}><Glyphicon glyph="trash"/></a>}
                      />
                  </div>
                );
              }.bind(this))
            }
            <div>
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
                    <div className="form-group">cue:</div>
                    <ValidatingTextInput name="AutoValue" type="text"
                      value={this.state.newCueName}
                      onChange={e=>{this.setState({newCueName: e.target.value});}}
                      validate={this.validateNewCueAttribute} />
                    {
                        /* <Input type="text" value={this.state.newCueName} onChange={e=>{this.setState({newCueName: e.target.value});}} /> */
                    }
                    <div className="form-group">
                      <a onClick={this.addCue} title="add"><Glyphicon glyph="ok" /></a>
                      &nbsp;
                      <a onClick={this.toggleAddCue} title="add"><Glyphicon glyph="remove" /></a>
                    </div>
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
