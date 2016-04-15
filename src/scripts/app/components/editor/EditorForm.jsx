'use strict';

var log = require('loglevel');
var Constants = require("../../constants");

var React = require("react"),
    Fluxxor = require("fluxxor"),
    FluxMixin = Fluxxor.FluxMixin(React);

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var Modal = require('react-bootstrap/lib/Modal');

//components
var ComponentSpecForm = require("./ComponentSpecForm"),
    EditorMenuGroup = require("./EditorMenuGroup");

//mixins
var ComponentUsageMixin = require('../../mixins/ComponentUsageMixin');
var History = require("react-router").History;

//utils
var classNames = require('classnames');
var ReactAlert = require('../../util/ReactAlert');
var ComponentSpec = require('../../service/ComponentSpec');

/**
* EditorForm - Form routing endpoint for spec editor, either new/existing component/profile
* Routing params assumed: 'type' and 'componentId' OR 'profileId'
* @constructor
*/
var EditorForm = React.createClass({
  mixins: [FluxMixin, History, ComponentUsageMixin],

  propTypes: {
    item: React.PropTypes.object, /* can be null while loading */
    spec: React.PropTypes.object, /* can be null while loading */
    type: React.PropTypes.string.isRequired,
    loading: React.PropTypes.bool.isRequired,
    processing: React.PropTypes.bool.isRequired,
    expansionState: React.PropTypes.object.isRequired,
    linkedComponents: React.PropTypes.object.isRequired,
    selectedComponentId: React.PropTypes.string,
    isNew: React.PropTypes.bool.isRequired
  },

  childContextTypes: {
      validationListener: React.PropTypes.object
  },

  getChildContext: function() {
    return {
      // here we can fetch validating inputs for triggering on save
      // (picked up from context by ValidatingTextInput components)
      validationListener: this.validationListener
    }
  },

  render: function () {
    if(this.props.loading || this.props.item == null | this.props.spec == null) {
      return (<div>Loading component...</div>);
    } else {
      //if type changed for an existing component, it can only be saved as new
      var saveDisallowed = !this.props.isNew && ((this.props.type === Constants.TYPE_PROFILE) != ComponentSpec.isProfile(this.props.spec));

      var editorClasses = classNames('editorGroup',
      {
        'processing': this.props.processing,
        'open': true
      });
      return (
        <div className={editorClasses}>

          {/* 'hook' for editor modals */}
          <div id="typeModalContainer"></div>
          <div id="ccrModalContainer"></div>

          <h3>
            {ComponentSpec.isProfile(this.props.spec)
              ? (this.props.isNew||saveDisallowed?"New profile":"Edit profile")
              :(this.props.isNew||saveDisallowed?"New component":"Edit component")}
          </h3>

          <EditorMenuGroup
            isNew={this.props.isNew || saveDisallowed}
            onSave={this.handleSave}
            onSaveNew={this.handleSaveNew}
            onPublish={this.handlePublish}
            onCancel={this.handleCancel}
            disabled={this.props.processing}
          />

          <ComponentSpecForm
            spec={this.props.spec}
            item={this.props.item}
            expansionState={this.props.expansionState}
            linkedComponents={this.props.linkedComponents}
            componentLinkingMode={this.props.componentLinkingMode}
            onComponentToggle={this.props.onComponentToggle}
            onTypeChange={this.setType}
            onHeaderChange={this.updateHeader}
            onItemChange={this.updateItem}
            onComponentChange={this.updateComponentSpec}
            onStartComponentLink={this.handleStartComponentLink}
            onCancelComponentLink={this.handleCancelComponentLink}
            selectedComponentId={this.props.selectedComponentId}
            onExpandAll={this.expandAll}
            onCollapseAll={this.collapseAll}
            />
        </div>
      );
    }
  },

  /**
   * Required by ComponentUsageMixin
   */
  renderUsageModalContent: function(errors, doContinue, doAbort) {
    return [(
      <Modal.Body key="body">
        <div className="modal-desc">
          <div>The component you are about to save is used by the following component(s) and/or profile(s):
            <ul>{errors}</ul>
          </div>
        </div>
      </Modal.Body>
    ), (
      <Modal.Footer key="footer">
          <div>Changes in this component will affect the above. Do you want to proceed?</div>
          <Button onClick={doContinue} bsStyle="primary">Yes</Button>
          <Button onClick={doAbort}>No</Button>
      </Modal.Footer>
    )];
  },

  /*=== Event handlers for child components ====*/

  handleStartComponentLink: function(id) {
    this.getFlux().actions.startComponentLink(id);
  },

  handleCancelComponentLink: function() {
    this.getFlux().actions.cancelComponentLink();
  },

  handleSave: function() {
    if(this.validateChildren()) {
      this.getFlux().actions.saveComponentSpec(this.props.spec, this.props.item, this.afterSuccess, this.handleUsageWarning);
    }
  },

  handleSaveNew: function() {
    if(this.validateChildren()) {
      this.getFlux().actions.saveNewComponentSpec(this.props.spec, this.props.item, this.afterSuccess);
    }
  },

  handlePublish: function() {
    if(this.validateChildren()) {
      this.getFlux().actions.publishComponentSpec(this.props.spec, this.props.item, this.afterSuccess);
    }
  },

  handleCancel: function() {
    ReactAlert.showConfirmationDialogue(
      "Cancel editing",
      "Do you want to cancel editing this "
        + (this.props.type === Constants.TYPE_PROFILE ? "profile":"component")
        + "? Any changes will be discarded.",
      this.getFlux().actions.loadComponentSpec.bind(this, this.props.type, this.props.item.id, this.afterSuccess));
    ;
  },

  afterSuccess: function() {
    this.history.pushState(null, "/browser");
  },

  setType: function(type) {
    this.getFlux().actions.setType(this.props.spec, type);
  },

  updateHeader: function(change) {
    this.getFlux().actions.updateHeader(this.props.spec, this.props.item, change);
  },

  updateItem: function(change) {
    this.getFlux().actions.updateItem(this.props.item, change);
  },

  updateComponentSpec: function(change) {
    this.getFlux().actions.updateSpec(this.props.spec, change);
  },

  expandAll: function(spec) {
    this.getFlux().actions.expandAll(spec);
  },

  collapseAll: function(spec) {
    this.getFlux().actions.collapseAll(spec);
  },

  /*=== Input validation ====
   * This ensures that all validating inputs are locally validated once more
   * when trying to save or publish
   */

  validationListener: {
    add: function(item) {
      log.trace("Adding validation item", item);
      if(this.validationItems == null) {
        this.validationItems = [];
      }
      this.validationItems.push(item);
    },

    remove: function(item) {
      if($.isArray(this.validationItems)) {
        for(var i=0;i<(this.validationItems.length);i++) {
          if(this.validationItems[i] === item) {
            break;
          }
        }
        log.trace("Removing validation item", i, item);
        this.validationItems.splice(i, 1);
      }
    }
  },

  validateChildren: function() {
    var result = true;

    var validationItems = this.validationListener.validationItems;
    log.debug("Validating children:", validationItems);

    if(validationItems != null) {
      for(var i=0;i<(validationItems.length);i++) {
        var item = validationItems[i];
        log.debug("Validating", item);
        if(!item.doValidate()) {
          result = false;
        }
      }
    }
    if(!result) {
      ReactAlert.showMessage("Validation errors", "There are validation errors, see the marked fields for details.");
    }
    return result;
  }


});

module.exports = EditorForm;
