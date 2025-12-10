'use strict';

var log = require('loglevel');

var React = require('react');

//bootstrap
var Input = require('react-bootstrap/lib/Input');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var ValidatingComponentMixin = require('../../mixins/ValidatingComponentMixin');

/**
* ValidatingTextInput - bootstrap text input with added dynamic validation capacity
* by means of a validation function that is passed as a required property that
* is evaluated on blur (lost focus). Any validation message provided by that
* function is shown in an input box "addon".
*
* @constructor
*/
var ValidatingTextInput = React.createClass({
  mixins: [ImmutableRenderMixin, ValidatingComponentMixin],

  propTypes: {
    validate: React.PropTypes.func.isRequired,
    name: React.PropTypes.string.isRequired,
    //value (any type)
  },

  render: function() {
    var {validate, bsStyle, addonAfter, ...other} = this.props;
    var bsStyleOverride = (this.isValidated() && !this.isValid())?"error":bsStyle;
    return <Input ref="input" bsStyle={bsStyleOverride} hasFeedback={true} addonAfter={this.getValidationMessage() || addonAfter} onBlur={this.onBlur} {...other} />;
  },

  onBlur: function(evt) {
    this.doValidate();
  },

  doValidate: function() {
    var val = this.props.value;
    var name = this.props.name;

    // validation method has the option to provide a feedback message
    var msgContainer = { message: null }
    var setMsg = function(message) { msgContainer.message = message; }

    //do validation
    log.trace("Sending to the validator:", name, "=", val);
    var valid = this.props.validate(val, name, setMsg);

    log.trace("Validated",val,":",valid);
    this.setValidation(valid, msgContainer.message);

    return valid;
  }
});

module.exports = ValidatingTextInput;
