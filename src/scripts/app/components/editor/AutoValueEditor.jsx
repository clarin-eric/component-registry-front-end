'use strict';

var log = require('loglevel');
var React = require('react');

//components
var ValidatingTextInput = require('./ValidatingTextInput');

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var CmdiVersionModeMixin = require('../../mixins/CmdiVersionModeMixin');

//utils
var update = require('react-addons-update');

const autoValueExpr = /^[A-Za-z][A-Za-z\d-]*_[A-Za-z\d-]+$/; // e.g. test-123_Abc-123

/**
 * AutoValueEditor
 * @type {[type]}
 */
var AutoValueEditor = React.createClass({
  mixins: [ImmutableRenderMixin, CmdiVersionModeMixin],

  propTypes: {
    autoValue: React.PropTypes.array,
    onChange: React.PropTypes.func.isRequired,
    validate: React.PropTypes.func.isRequired
  },

  addAutoValueExpression: function() {
    if($.isArray(this.props.autoValue)) {
      this.props.onChange(update(this.props.autoValue, {$push: [""]}));
    } else {
      this.props.onChange([""]);
    }
  },

  updateAutoValueExpression: function(index, evt) {
    log.debug("Update auto value expression", index, evt);
    var newValue = evt.target.value;
    this.props.onChange(update(this.props.autoValue, {$splice: [[index, 1, newValue]]}));
  },

  removeAutoValueExpression: function(index) {
    log.debug("Remove auto value expression", index);
    this.props.onChange(update(this.props.autoValue, {$splice: [[index, 1]]}));
  },

  validateAutoValueCue: function(val, targetName, feedback) {
    log.debug('validateAutoValueCue', val, targetName, feedback);

    if(val != null && autoValueExpr.test(val)) {
      return !this.props.validate || this.props.validate(val, targetName, feedback);
    } else {
      if(feedback != undefined) {
        feedback('Not a valid auto value expression');
      }
      return false;
    }    
  },

  render: function () {
    return (
      <div className="auto-value">
          <label className="control-label editorFormLabel">Automatic value expressions</label>
          <div className="form-groups">
            {$.isArray(this.props.autoValue) &&
              this.props.autoValue.map(function(value, idx) {
                return (
                  <ValidatingTextInput key={idx} name="AutoValue" type="text" value={value}
                    disabled={!this.isCmdi12Mode()}
                  wrapperClassName="editorFormField" onChange={this.updateAutoValueExpression.bind(this, idx)} 
                  validate={this.validateAutoValueCue}
                  addonAfter={
                    <a className="delete" 
                    onClick={this.removeAutoValueExpression.bind(this, idx)}><Glyphicon glyph="trash"/></a>
                  }
                  />
                );
              }.bind(this))
            }
            <div>
            {this.isCmdi12Mode() ?
              <div>
                <div className="additional-autovalue-expression">
                  <a onClick={this.addAutoValueExpression}>
                    {(!this.props.autoValue || this.props.autoValue.length == 0) ? <span>Create an automatic value expression</span> : <span>Add an automatic value expression</span>} <Glyphicon glyph="plus" />
                  </a>
                </div>
                {$.isArray(this.props.autoValue) && this.props.autoValue.length > 0 &&
                  <p className="help-block">
                    Automatic value expressions must be <em>prefixed</em> with a string of alphanumeric characters, followed by an underscore: <tt>[prefix]_[name]</tt>.
                    Please choose a sufficiently unique prefix and use it consistently within the chosen context.
                  </p>
                }
              </div>
              : <strong>Automatic value expressions are not supported in CMDI 1.1. Switch to CMDI 1.2 mode to edit.</strong>
            }
            </div>
          </div>
      </div>
    );
  }
});

module.exports = AutoValueEditor;
