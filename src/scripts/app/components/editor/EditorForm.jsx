'use strict';

var log = require('loglevel');
var Constants = require("../../constants");

var React = require("react"),
    Fluxxor = require("fluxxor"),
    FluxMixin = Fluxxor.FluxMixin(React);

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var Modal = require('react-bootstrap/lib/Modal');
var Input = require('react-bootstrap/lib/Input');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//components
var ComponentSpecForm = require("./ComponentSpecForm"),
    EditorMenuGroup = require("./EditorMenuGroup");

//mixins
var ComponentUsageMixin = require('../../mixins/ComponentUsageMixin');
var CmdiVersionModeMixin = require('../../mixins/CmdiVersionModeMixin');

//utils
var _ = require('lodash');
var update = require('react-addons-update');
var classNames = require('classnames');
var ReactAlert = require('../../util/ReactAlert');
var ComponentSpec = require('../../service/ComponentSpec');

/**
* EditorForm - Form routing endpoint for spec editor, either new/existing component/profile
* Routing params assumed: 'type' and 'componentId' OR 'profileId'
* @constructor
*/
var EditorForm = React.createClass({
  mixins: [FluxMixin, ComponentUsageMixin, CmdiVersionModeMixin],

  propTypes: {
    item: React.PropTypes.object, /* can be null while loading */
    spec: React.PropTypes.object, /* can be null while loading */
    type: React.PropTypes.string.isRequired,
    loading: React.PropTypes.bool.isRequired,
    processing: React.PropTypes.bool.isRequired,
    onCmdiVersionModeChange: React.PropTypes.func.isRequired,
    expansionState: React.PropTypes.object.isRequired,
    linkedComponents: React.PropTypes.object.isRequired,
    selectedComponentId: React.PropTypes.string,
    derivedFromId: React.PropTypes.string,
    isNew: React.PropTypes.bool.isRequired,
    userHasSaveRights: React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      userHasSaveRights: true
    };
  },

  contextTypes: {
    router: React.PropTypes.object.isRequired
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
          <div id="externalVocabModalContainer"></div>
          <div id="externalVocabImportModalContainer"></div>
          <div id="documentationLanguageModalContainer"></div>

          <h3>
            {ComponentSpec.isProfile(this.props.spec)
              ? (this.props.isNew||saveDisallowed?"New profile":"Edit profile")
              :(this.props.isNew||saveDisallowed?"New component":"Edit component")}
          </h3>

          <div className={classNames("cmdi-version-mode-selector",{
              "cmdi11": this.getCmdiVersionMode() === Constants.CMD_VERSION_1_1,
              "cmdi12": this.getCmdiVersionMode() === Constants.CMD_VERSION_1_2
            })}>
            <Input type="select" value={this.getCmdiVersionMode()} onChange={this.handleCmdiVersionModeChange}>
              <option value={Constants.CMD_VERSION_1_1}>CMDI 1.1 mode</option>
              <option value={Constants.CMD_VERSION_1_2}>CMDI 1.2 mode</option>
            </Input>
            {this.isCmdi11Mode() &&
              <div>
                <p><Glyphicon glyph="warning-sign"/> In the current mode, certain parts of the editor (including external vocabularies, optional attributes and multilingual documentation) are hidden or deactivated so that <em>new</em> features that are not available in CMDI 1.1 can not be added.
                However, be aware that <em>existing usages</em> of such features in the edited item are not effected by the editing mode.</p>
                <p>The editing mode also does not affect the availability of a component or profile as either CMDI 1.1 or CMDI 1.2 from the registry.</p>
                <p>For more information, visit <a href="https://www.clarin.eu/cmdi1.2" target="_blank">clarin.eu/cmdi1.2</a>.</p>
              </div>
            }
            {this.isCmdi12Mode() &&
              <div>
                <p><Glyphicon glyph="info-sign"/> All CMDI 1.2 features are available.
                  Be aware that this component or profile will also be available as a CMDI 1.1 version, in which such features (including external vocabularies, optional attributes and multilingual documentation) will not be represented.</p>
                <p>Switch to CMDI 1.1 mode to disable all features that are only available in CMDI 1.2 and higher.</p>
                <p>For more information, visit <a href="https://www.clarin.eu/cmdi1.2" target="_blank">clarin.eu/cmdi1.2</a>.</p>
              </div>
            }
          </div>

          {
            !this.props.isNew && this.props.item && this.props.item.isPublic === 'true' && 
            <div className="publicItemEditingWarning danger"><Glyphicon glyph="warning-sign"/>You are editing an item that has been published!</div>
          }

          <EditorMenuGroup
            forceNew={this.props.isNew || !this.props.userHasSaveRights || saveDisallowed}
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
            loadLinkedComponents={this.handleLoadLinkedComponents}
            {... this.getCmdiVersionModeProps() /* from CmdiVersionModeMixin*/}
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
      var spec = this.props.spec;
      if(this.props.derivedFromId != null) {
        log.debug("Setting derived from header:", this.props.derivedFromId);
        spec = update(spec, {Header: {$merge: {
          DerivedFrom: this.props.derivedFromId
        }}});
      }
      if(!_.isEmpty(spec.Header.Successor && spec.Header.Successor.trim())) {
        log.debug("Removing successor header:", spec.Header.Successor);
        spec = update(spec, {Header: {Successor: {$set: null}}});
      }
      this.getFlux().actions.saveNewComponentSpec(spec, this.props.item, this.afterSuccess);
    }
  },

  handlePublish: function(status) {
    if(this.validateChildren()) {
      this.getFlux().actions.publishComponentSpec(this.props.spec, status, this.props.item, this.afterSuccess);
    }
  },

  handleCancel: function() {
    //determine cancel action
    if(this.props.isNew) { //just go back to browser
      var doCancel = this.afterSuccess;
    } else { //go back to browser but reload component first to reset any changes from editor
      var doCancel = this.getFlux().actions.loadComponentSpec.bind(this, this.props.type, this.props.item.id, this.afterSuccess);
    }
    ReactAlert.showConfirmationDialogue(
      "Cancel editing",
      "Do you want to cancel editing this "
        + (this.props.type === Constants.TYPE_PROFILE ? "profile":"component")
        + "? Any changes will be discarded.",
      doCancel);
  },

  handleLoadLinkedComponents: function(ids) {
    log.debug("Loading linked child components", ids);
    this.getFlux().actions.loadLinkedComponentSpecsById(ids);
  },

  handleCmdiVersionModeChange: function(evt) {
    this.props.onCmdiVersionModeChange(evt.target.value);
  },

  afterSuccess: function() {
    this.context.router.push("/browser");
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
        log.trace("Validating", item);
        if(!item.doValidate()) {
          log.warn("Validation failed for item with value", item.value, item);
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
