'use strict';

var log = require('loglevel');
var changeObj = require('../util/ImmutabilityUtil').changeObj;
var ComponentSpec = require('../service/ComponentSpec');
/**
* SpecFormUpdateMixin - Common functions and properties for the specification
* form components for updating properties and children
*
* Add to your component:
* - propagateValue: function(field, value)
*
* @mixin
*/
var SpecFormUpdateMixin = {

  generateAppIdForNew: ComponentSpec.generateAppIdForNew,

  /* Methods that handle changes (in this component and its children) */
  updateConceptLink: function(val) {
    this.propagateValue("@ConceptLink", val);
  },

  updateDocumentation: function(documentation) {
    log.trace("Update documentation", documentation);
    this.propagateValue("Documentation", documentation);
  },

  addNewAttribute: function(onChange, evt) {
    var spec = this.props.spec;
    var attrList = spec.AttributeList;

    var appId = this.generateAppIdForNew(spec._appId, (attrList == null) ? null : attrList.Attribute)
    var newAttrObj = { Name: "", "@ValueScheme": "string", _appId: appId };

    var update;
    if(attrList == null) {
      // create prepopulated attrlist
      update = {$merge: {AttributeList: {Attribute: [newAttrObj]}}};
    } else {
      var attribute = attrList.Attribute;
      if(attribute == null) {
        // add first attribute wrapped in new array
        update = {AttributeList: {Attribute: {$set: [newAttrObj]}}};
      } else if($.isArray(attribute)) {
        // push new to existing array
        update = {AttributeList: {Attribute: {$push: [newAttrObj]}}};
      } else {
        // not an array, turn into array and add new
        update = {AttributeList: {Attribute: {$set: [spec.AttributeList.Attribute, newAttrObj]}}};
      }
    }
    log.debug("Update attribute:", update);
    onChange(update);
  },

  addNewAttributeFromElement: function(evt) {
    var newAttrObj = { Name: "", Type: "string" }; //TODO check format

    var spec = this.state.spec;

    var attrList = (spec.AttributeList != undefined && $.isArray(spec.AttributeList.Attribute)) ? spec.AttributeList.Attribute : spec.AttributeList;
    if(attrList != undefined && !$.isArray(attrList))
      attrList = [attrList];

    var spec = (attrList == undefined) ?
      update(spec, { AttributeList: { $set: { Attribute: [newAttrObj] }} }) :
      update(spec, { AttributeList: { $set: { Attribute: update(attrList, { $push: [newAttrObj] }) } } });

    log.debug('new item after attr add: ' + JSON.stringify(spec));
    if(this.state.spec != null)
      this.setState({ spec: spec });
  },

 /**
 * triggers an update of the value scheme of an element or attribute
 * @param  {function} onChange function that takes two parameters: type, valueScheme, one of which is non-null
 * @param  {object} val      [description]
 */
  updateValueScheme: function(onChange, valueScheme) {
    log.debug("Value scheme", valueScheme);

    var type = null;
    var valScheme = null;

    if(valueScheme.type != null) {
      type = valueScheme.type;
    } else if(valueScheme.pattern != null) {
      valScheme = {
        pattern: valueScheme.pattern
      };
    } else if(valueScheme.vocabulary != null) {
      valScheme = {
        Vocabulary: valueScheme.vocabulary
      };
    }

    onChange(type, valScheme);
  },

  handleAttributeChange: function(onChange, index, change) {
    var update = {AttributeList: {Attribute: changeObj(index, change)}};
    log.trace("Update attribute", update);
    onChange(update);
  }
}

module.exports = SpecFormUpdateMixin;
