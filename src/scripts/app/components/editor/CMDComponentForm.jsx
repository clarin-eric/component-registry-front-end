'use strict';

var log = require('loglevel');
var _ = require('lodash');

var React = require('react');
var ReactCSSTransitionGroup = require('react-addons-css-transition-group');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var CMDComponentMixin = require('../../mixins/CMDComponentMixin');
var ToggleExpansionMixin = require('../../mixins/ToggleExpansionMixin');
var SpecFormUpdateMixin = require('../../mixins/SpecFormUpdateMixin');
var ActionButtonsMixin = require('../../mixins/ActionButtonsMixin');
var CmdiVersionModeMixin = require('../../mixins/CmdiVersionModeMixin');
var ValidatingComponentMixin = require('../../mixins/ValidatingComponentMixin');
var MoreLessComponentMixin = require('../../mixins/MoreLessComponentMixin');

//components
var CMDElementForm = require('./CMDElementForm');
var CMDAttributeForm = require('./CMDAttributeForm');
var CardinalityInput = require('./CardinalityInput');
var ValidatingTextInput = require('./ValidatingTextInput');
var ConceptLinkInput = require('./ConceptLinkInput');
var DocumentationInput = require('./DocumentationInput');
var CMDComponentView = require('../browser/CMDComponentView');
var CuesEditor = require('./CuesEditor');

//bootstrap
var Dropdown = require('react-bootstrap/lib/Dropdown');
var MenuItem = require('react-bootstrap/lib/MenuItem');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//utils
var classNames = require('classnames');
var Validation = require('../../service/Validation');
var changeObj = require('../../util/ImmutabilityUtil').changeObj;
var ReactAlert = require('../../util/ReactAlert');

require('../../../../styles/CMDComponent.sass');

/**
* CMDComponentForm - editing form for a CMDI Component item, including (part of)
* the root component
*
* @constructor
* @mixes ImmutableRenderMixin
* @mixes CMDComponentMixin
* @mixes SpecFormUpdateMixin
*/
var CMDComponentForm = React.createClass({
  mixins: [ImmutableRenderMixin,
            CMDComponentMixin,
            ToggleExpansionMixin,
            SpecFormUpdateMixin,
            ActionButtonsMixin,
            ValidatingComponentMixin,
            CmdiVersionModeMixin,
            MoreLessComponentMixin],

  propTypes: {
    onComponentChange: React.PropTypes.func.isRequired,
    onStartComponentLink: React.PropTypes.func.isRequired,
    onCancelComponentLink: React.PropTypes.func.isRequired,
    loadLinkedComponents: React.PropTypes.func.isRequired,
    selectedComponentId: React.PropTypes.string
    /* more props defined in CMDComponentMixin, ToggleExpansionMixin and ActionButtonsMixin */
  },

  getDefaultProps: function() {
    return {
      renderChildrenWhenCollapsed: true
    };
  },

  componentDidUpdate: function(prevProps) {
    //trigger validation (only) on structural changes (content changes should be covered by individual form components)
    var spec = this.props.spec;
    var prevSpec = prevProps.spec;
    if(prevSpec.Component != spec.Component
      || prevSpec.Element != spec.Element
      || prevSpec.AttributeList != spec.AttributeList) {
      this.doValidate();
    }
  },

  /**
   * used by CMDComponentMixin
   */
  isSelected: function() {
    return this.props.componentLinkingMode && this.props.spec._appId === this.props.selectedComponentId;
  },

  /**
   * Components should always be open by default
   * @return {boolean}
   */
  getDefaultOpenState: function() {
    return true;
  },

  /*=== Render functions ===*/

  /* main render() function in CMDComponentMixin */

  renderComponentProperties: function(comp) {
    var open = this.isOpen();
    log.trace("Component", this.props.spec._appId, " open state:", open);

    var compName = (comp['@name'] == "") ? "[New Component]" : comp['@name'];
    var cardOpt = !open? ( <span>&nbsp;[{(comp['@CardinalityMin'] || 1) + " - " + (comp['@CardinalityMax'] || 1)}]</span> ) : null;

    var editableProps = open?(
      <div className="panel-body componentProps">
        <ValidatingTextInput type="text" name="@name" label="Name" value={comp['@name']}
          labelClassName="editorFormLabel" wrapperClassName="editorFormField"
          onChange={this.updateComponentValue} validate={this.validate}  />
        <ConceptLinkInput name="@ConceptLink" label="ConceptLink" value={(comp['@ConceptLink']) ? comp['@ConceptLink'] : ""}
          labelClassName="editorFormLabel" wrapperClassName="editorFormField" ref="conceptRegInput"
          onChange={this.updateComponentValue} validate={this.validate}
          updateConceptLink={this.updateConceptLink} />
        <DocumentationInput
          name="Documentation" label="Documentation" value={comp['Documentation']}
          labelClassName="editorFormLabel" wrapperClassName="editorFormField"
          onChange={this.updateDocumentation}
          {... this.getCmdiVersionModeProps() /* from CmdiVersionModeMixin*/}/>
        <CardinalityInput min={comp['@CardinalityMin']} max={comp['@CardinalityMax']} onValueChange={this.updateComponentValue} />
        {this.isMoreShown() && /* MoreLessComponentMixin */
          <div className="more">
            <CuesEditor otherAttributes={comp.otherAttributes} onChange={this.onCuesChange} validate={this.validate}
              {... this.getCmdiVersionModeProps() /* from CmdiVersionModeMixin*/} />
          </div>
        }
        {this.renderMoreLessToggler({
          expandText: "Additional component options",
          collapseText: "Hide additional component options"
        })}
      </div>
    ) : null;

    var appId = this.props.spec._appId;
    var title = <span>Component: <span className="componentName">{compName}</span> {cardOpt}</span>;
    return (
      <div className="panel panel-info">
        <div className="panel-heading">
        {this.createActionButtons({
          title: title,
          isSelected: this.isSelected(),
          isLinked: this.props.isLinked
        })}
        </div>
        {editableProps}
      </div>
    );
  },

  renderBeforeChildren: function() {
    var validationMessage = this.getValidationMessage();
    if(validationMessage) {
      return <div className="error">{validationMessage}</div>
    } else {
      return null;
    }
  },

  hasChildren: function() {
    var spec = this.props.spec;
    return ($.isArray(spec.Element) && spec.Element.length > 0)
      || ($.isArray(spec.Component) && spec.Component.length > 0)
      || (spec.AttributeList && $.isArray(spec.AttributeList.Attribute) && spec.AttributeList.Attribute.length > 0);
  },

  renderNestedComponent: function(spec, header, compId, isLinked, linkedSpecAvailable, index) {
    // component to render depends on whether it is linked (view) or inline (form)

    // common properties (for both view and form)
    var componentProperties = {
      key: spec._appId,
      spec: spec,
      header: header,
      parent: this.props.spec,
      linkedComponents: this.props.linkedComponents,
      isLinked: isLinked,
      onMove: this.handleMoveComponent.bind(this, this.props.onComponentChange, index),
      onRemove: this.handleRemoveComponent.bind(this, this.props.onComponentChange, index),
      isFirst: index == 0,
      isLast: index == this.props.spec.Component.length - 1,
      compId: compId
    };

    if(isLinked) {
      if(linkedSpecAvailable) {
        // linked components do not get a full form, but cardinality can be edited
        var link = this.props.spec.Component[index];
        var minC = link['@CardinalityMin'];
        if(minC == null) minC = "1";
        var maxC = link['@CardinalityMax'];
        if(maxC == null) maxC = "1";
        // we're hiding the cardinality in the view and replacing it with an inline form
        var formElements = (
          <div className="componentProps">
            <CardinalityInput min={minC} max={maxC} onValueChange={this.updateChildComponentValue.bind(this, index)} />
          </div>
        );

        if(header.Successor && header.Successor != '') {
          var replaceSuccessor = this.replaceSuccessor.bind(this, header, index);
        } else {
          var replaceSuccessor = null;
        }

        return (
          <div key={componentProperties.key + "_linkform"} className="linkedComponentForm">
            <CMDComponentView
              isLinked={true}
              link={link}
              hideCardinality={true}
              formElements={formElements}
              onReplaceWithSuccessor={replaceSuccessor}
              {... componentProperties}
              {... this.getExpansionProps()} /* from ToggleExpansionMixin*/
            />
          </div>
          );
      } else {
        return (<div className="CMDComponent" key={compId + "_" + index}>Component {compId} loading...</div>);
      }
    } else {
      // inline child components do get a form
      return (<CMDComponentForm
        {... componentProperties}
        {... this.getExpansionProps() /* from ToggleExpansionMixin*/}
        {... this.getCmdiVersionModeProps() /* from CmdiVersionModeMixin*/}
        selectedComponentId={this.props.selectedComponentId}
        onComponentChange={this.handleComponentChange.bind(this, index)}
        onStartComponentLink={this.props.onStartComponentLink}
        onCancelComponentLink={this.props.onCancelComponentLink}
        componentLinkingMode={this.props.componentLinkingMode}
        loadLinkedComponents={this.props.loadLinkedComponents}
        checkUniqueName={Validation.checkUniqueSiblingName.bind(this, this.props.spec.Component)}
        />);
    }
  },

  renderElement: function(elem, index) {
    return <CMDElementForm
              key={elem._appId}
              spec={elem}
              onElementChange={this.handleElementChange.bind(this, index)}
              onMove={this.handleMoveElement.bind(this, this.props.onComponentChange, index)}
              onRemove={this.handleRemoveElement.bind(this, this.props.onComponentChange, index)}
              index={index}
              isFirst={index == 0}
              isLast={index == this.props.spec.Element.length - 1}
              checkUniqueName={Validation.checkUniqueSiblingName.bind(this, this.props.spec.Element)}
              {... this.getExpansionProps() /* from ToggleExpansionMixin*/}
              {... this.getCmdiVersionModeProps() /* from CmdiVersionModeMixin*/}
              checkDisplayPriorities={this.checkDisplayPriorities}
              />;
  },

  renderAttribute: function(attr, index) {
    return <CMDAttributeForm
              key={attr._appId} spec={attr}
              onAttributeChange={this.handleAttributeChange.bind(this, this.props.onComponentChange, index)}
              onMove={this.handleMoveAttribute.bind(this, this.props.onComponentChange, index)}
              onRemove={this.handleRemoveAttribute.bind(this, this.props.onComponentChange, index)}
              isFirst={index == 0}
              isLast={index == this.props.spec.AttributeList.Attribute.length - 1}
              checkUniqueName={Validation.checkUniqueSiblingName.bind(this, this.props.spec.AttributeList.Attribute)}
              {... this.getExpansionProps() /* from ToggleExpansionMixin*/}
              {... this.getCmdiVersionModeProps() /* from CmdiVersionModeMixin*/}
       />;
  },

  renderAfterComponents: function() {
    return (
      <div>
        {this.isSelected() &&
          <div className="componentInsertionTarget" title="Use the table below to link a component into this component">
            <a title="Cancel linking" className="cancelLink" onClick={this.props.onCancelComponentLink}><Glyphicon glyph="remove"/></a>
            Linked component will be inserted here (select from table below).<br />
          </div>}
        {this.isOpen() &&
          <div className="addComponent">
            <Dropdown id={"componentAddMenu-"+this.props.spec._appId}>
              <a href="#" title="Options" bsRole="toggle" onClick={function(e){e.preventDefault();}}>
                +Component
              </a>
              <Dropdown.Menu>
                {!this.isSelected() &&
                  <MenuItem onClick={this.props.onStartComponentLink.bind(null, this.props.spec._appId)}
                    title="Link an existing component by selecting an item from the components table">
                    Link existing component
                  </MenuItem>
                }
                <MenuItem onClick={this.addNewComponent}
                  title="Create a new component that is defined locally (not for reuse elsewhere)">
                  Create inline component
                </MenuItem>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        }
      </div>
    );
  },

  renderAfterElements: function() {
    return this.isOpen() ? <div className="addElement"><a onClick={this.addNewElement}>+Element</a></div> : null;
  },

  renderAfterAttributes: function() {
    return this.isOpen() ? <div className="addAttribute controlLinks"><a onClick={this.addNewAttribute.bind(this, this.props.onComponentChange)}>+Attribute</a></div> : null;
  },

  wrapNestedComponents: function(components) {
    return (
      <ReactCSSTransitionGroup transitionName="editor-items" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
        {components}
      </ReactCSSTransitionGroup>
    );
  },

  wrapElements: function(elements) {
    return (
      <ReactCSSTransitionGroup transitionName="editor-items" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
        {elements}
      </ReactCSSTransitionGroup>
    );
  },

  wrapAttributes: function(attributes) {
    return (
      <ReactCSSTransitionGroup transitionName="editor-items" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
        {attributes}
      </ReactCSSTransitionGroup>
    );
  },

  /*=== Functions that handle changes (in this component and its children) ===*/

  propagateValue: function(field, value) {
    //send 'command' to merge existing spec section with this delta
    //(see https://facebook.github.io/react/docs/update.html)
    log.trace("Update component field:", field, "to:", value);
    this.props.onComponentChange({$merge: changeObj(field, value)});
  },

  handleComponentChange: function(index, change) {
    //an update of the child component at [index] has been requested, push up
    this.props.onComponentChange({Component: changeObj(index, change)});
  },

  handleElementChange: function(index, change) {
    var update = {Element: changeObj(index, change)};
    log.trace("Update element", update);
    this.props.onComponentChange(update);
  },

  updateComponentValue: function(e) {
    //a property of this component has changed
    this.propagateValue(e.target.name, e.target.value);
  },

  updateChildComponentValue: function(index, e) {
    var field = e.target.name;
    var value = e.target.value;
    log.debug("Update property of child component",index,field,"=",value);
    this.handleComponentChange(index, {$merge: changeObj(field, value)});
  },

  replaceSuccessor: function(header, index) {
    var successorId = header.Successor;
    if(successorId == null) {
      log.error("No successor id found in header", header);
    }
    log.debug("Replace child component", index ,"with its successor", successorId);
    //TODO: let user confirm, then send change request up the chain
    ReactAlert.showConfirmationDialogue('Replace with successor',
      <div>Do you want to replace the linked child component <em>{header.Name}</em> with its successor (component {successorId})?
        This change will become permanent when you save the current item.</div>,
      this.handleReplaceLinkedComponent.bind(this, index, successorId));
  },

  handleReplaceLinkedComponent: function(index, successorId) {
    var spec = this.props.spec;
    var appId = this.generateAppIdForNew(spec._appId, spec.Component);
    var newComponent = {'@ComponentRef': successorId, '_appId': appId};
    log.debug("Replace component", index, spec.Component[index], "with", newComponent);
    this.props.onComponentChange({Component: {$splice: [[index, 1, newComponent]]}});
    this.props.loadLinkedComponents([successorId]);
  },

  onCuesChange: function(otherAttributes) {
    this.props.onComponentChange({'otherAttributes': {$set: otherAttributes}});
  },

  /*=== Functions that add new children ===*/

  addNewComponent: function(evt) {
    var spec = this.props.spec;
    var appId = this.generateAppIdForNew(spec._appId, spec.Component);
    var newComp = { "@name": "", "@CardinalityMin": "1", "@CardinalityMax": "1", "_appId": appId };
    log.debug("Adding new component to", spec._appId, newComp);
    if(spec.Component == null) {
      this.props.onComponentChange({$merge: {Component: [newComp]}});
    } else {
      this.props.onComponentChange({Component: {$push: [newComp]}});
    }
  },

  addNewElement: function(evt) {
    var spec = this.props.spec;
    var appId = this.generateAppIdForNew(spec._appId, spec.Element);
    var newElem = { "@name": "", "@ValueScheme": "string", "@CardinalityMin": "1", "@CardinalityMax": "1", "_appId": appId };
    log.debug("Adding new element to", spec._appId, newElem);
    if(spec.Element == null) {
      this.props.onComponentChange({$merge: {Element: [newElem]}});
    } else {
      this.props.onComponentChange({Element: {$push: [newElem]}});
    }
  },

  /*=== Validation of field values ====*/

  validate: function(val, targetName, feedback) {
    return Validation.validateField('component', targetName, val, feedback)
      && (targetName != '@name' || this.props.checkUniqueName(targetName, val, feedback));
  },

  checkDisplayPriorities: function() {
    var elements = this.props.spec.Element;
    if($.isArray(elements)) {
      // at least one element with non-zero display priority?
      return _.some(elements, function(element) {
        log.trace('checking element', element);
        return element['@cue:DisplayPriority'] != null && element['@cue:DisplayPriority'] !== '0';
      });
    } else {
      //no elements, so ok
      return true;
    }
  },

  doValidate: function() {
    if(this.hasChildren()) {
      return this.setValidation(true);
    } else {
      return this.setValidation(false, "A component cannot be empty! Add a child component, element or attribute to make this specification valid.");
    }
  }
});

module.exports = CMDComponentForm;
