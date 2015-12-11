'use strict';
var log = require('loglevel');

var React = require('react');
var Constants = require("../../constants");

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var ConceptLinkDialogueMixin = require('../../mixins/ConceptLinkDialogueMixin');

//bootstrap
var Input = require('react-bootstrap/lib/Input');

//components
var CMDComponentForm = require('./CMDComponentForm');
var ValidatingTextInput = require('./ValidatingTextInput');

//utils
var ComponentSpec = require('../../service/ComponentSpec');
var Validation = require('../../service/Validation');
var update = require('react-addons-update');
var classNames = require('classnames');
var md5 = require('spark-md5');

require('../../../../styles/ComponentViewer.sass');

/**
* ComponentViewer - view display and editing form for a CMDI Profile or Component item and its root properties, nested Components (CMDComponent), Elements, (CMDElement) and Attributes (CMDAttribute).
* @constructor
* @mixes ImmutableRenderMixin
*/
var ComponentSpecForm = React.createClass({
  mixins: [ImmutableRenderMixin, ConceptLinkDialogueMixin],

  propTypes: {
    spec: React.PropTypes.object.isRequired,
    item: React.PropTypes.object.isRequired,
    expansionState: React.PropTypes.object,
    linkedComponents: React.PropTypes.object,
    onComponentToggle: React.PropTypes.func.isRequired,
    onTypeChange: React.PropTypes.func.isRequired,
    onHeaderChange: React.PropTypes.func.isRequired,
    onItemChange: React.PropTypes.func.isRequired,
    onComponentChange: React.PropTypes.func.isRequired,
    onToggleSelection: React.PropTypes.func.isRequired,
    selectedComponentId: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      domains: require('../../../domains.js')
    };
  },

  render: function() {
    var spec = this.props.spec;
    var item = this.props.item;

    log.debug("Spec form item", item);

    if(spec == null || item == null) {
      return (
        <div className="ComponentViewer loading" />
      );
    } else {
      var rootClasses = classNames({ ComponentViewer: true });
      var rootComponent = spec.CMD_Component;

      // Display properties
      var conceptLink = (rootComponent && rootComponent['@ConceptLink'] != null) ? <li><span>ConceptLink:</span> <a href={rootComponent['@ConceptLink']}>{rootComponent['@ConceptLink']}</a></li> : null;
      var isProfile = ComponentSpec.isProfile(spec);

      return (
        <form ref="editComponentForm" name="editComponent" id="editComponent" className="form-horizontal form-group">
          <div className="form-group">
            <Input type="radio" name="isProfile" label="Profile" value={Constants.TYPE_PROFILE} checked={isProfile} onChange={this.handleTypeChange} wrapperClassName="editorFormField" />
            <Input type="radio" name="isProfile" label="Component" value={Constants.TYPE_COMPONENTS} checked={!isProfile} onChange={this.handleTypeChange} wrapperClassName="editorFormField" />
          </div>
          <ValidatingTextInput type="text" name="Name" label="Name" value={spec.Header.Name}
            labelClassName="editorFormLabel" wrapperClassName="editorFormField"
            onChange={this.handleHeaderChange} validate={this.validate}  />
          <Input type="text" name="groupName" label="Group" value={item.groupName} onChange={this.handleItemChange} labelClassName="editorFormLabel" wrapperClassName="editorFormField" />
          <ValidatingTextInput type="textarea" name="Description" label="Description" value={spec.Header.Description}
            labelClassName="editorFormLabel" wrapperClassName="editorFormField"
            onChange={this.handleHeaderChange} validate={this.validate} />
          <Input type="select" name="domainName" ref="rootComponentDomain" label="Domain" value={item.domainName} onChange={this.handleItemChange} labelClassName="editorFormLabel" wrapperClassName="editorFormField">
            <option value="">Select a domain...</option>
            {this.props.domains.map(function(domain, index) {
              return <option key={index} value={domain.data}>{domain.label}</option>
            })}
          </Input>
          <ValidatingTextInput ref="conceptRegInput" type="text" name="CMD_Component.@ConceptLink" label="ConceptLink" value={(spec.CMD_Component['@ConceptLink']) ? spec.CMD_Component['@ConceptLink'] : ""}
            labelClassName="editorFormLabel" wrapperClassName="editorFormField"
            onChange={this.handleConceptLinkChange} validate={this.validate}
            buttonAfter={this.newConceptLinkDialogueButton(this.updateConceptLinkValue)}
            />
            <CMDComponentForm
              spec={spec.CMD_Component}
              hideProperties={true}
              onToggle={this.props.onComponentToggle}
              expansionState={this.props.expansionState}
              linkedComponents={this.props.linkedComponents}
              onToggleSelection={this.props.onToggleSelection}
              onComponentChange={this.handleComponentChange}
              selectedComponentId={this.props.selectedComponentId}
              />
          </form>
        );
    }
  },

  handleTypeChange: function(e) {
    //pass changes to handler, the event target is input "isProfile" (value either profile or component type constant)
    this.props.onTypeChange(e.target.value);
  },

  handleItemChange: function(e) {
    //pass changes to handler, input name maps to field name
    var field = e.target.name;
    var value = e.target.value;
    this.props.onItemChange({[field]: value});
  },

  handleHeaderChange: function(e) {
    //pass changes to handler, input name maps to field name
    var field = e.target.name;
    var value = e.target.value;
    this.props.onHeaderChange({[field]: value});
  },

  handleComponentChange: function(change) {
    //an update of the root component has been pushed up
    var update = {CMD_Component: change};
    this.props.onComponentChange(update);
  },

  handleConceptLinkChange: function(e) {
    this.updateConceptLinkValue(e.target.value);
  },

  updateConceptLinkValue: function(val) {
    this.handleComponentChange({$merge: {['@ConceptLink']: val}});
  },

  validate: function(val, targetName, feedback) {
    return Validation.validateField('header', targetName, val, feedback);
  }
});

module.exports = ComponentSpecForm;