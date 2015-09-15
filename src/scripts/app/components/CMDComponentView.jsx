'use strict';

var React = require('react/addons');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var LinkedStateMixin = require('../../mixins/LinkedStateMixin');

//bootstrap
var Input = require('react-bootstrap/lib/Input');

//components
var CMDElementView = require('./CMDElementView');
var CMDAttributeView = require('./CMDAttributeView');

//utils
var update = React.addons.update;
var classNames = require('classnames');
var md5 = require('spark-md5');

require('../../../styles/CMDComponent.sass');

/**
* CMDComponent - view display and editing form for a CMDI Component item.
* @constructor
* @mixes ImmutableRenderMixin
* @mixes LinkedStateMixin
* @mixes ActionButtonsMixin
*/
var CMDComponentView = React.createClass({
  mixins: [ImmutableRenderMixin, LinkedStateMixin],
  propTypes: {
    /* specification object (CMD_Component) */
    spec: React.PropTypes.object.isRequired,
    /* determines whether 'envelope' with properties should be hidden */
    hideProperties: React.PropTypes.bool,
    /* determines whether the component should be shown in expanded state */
    open: React.PropTypes.bool,
    openAll: React.PropTypes.bool,
    closeAll: React.PropTypes.bool,
    key: React.PropTypes.string
  },
  getDefaultProps: function() {
    return {
      hideProperties: false,
      open: true,
      openAll: false,
      closeAll: false
    };
  },
  toggleComponent: function(evt) {
    //TODO flux: action
    // console.log('toggle component: ' + JSON.stringify(this.state.component));
    // if((!this.state.component.hasOwnProperty('open') || !this.state.component.open) &&
    //    this.state.component.hasOwnProperty('@ComponentId') && this.state.component.Header == undefined)
    //    this.loadComponentData();
    // else {
    //   var isOpen = (this.state.component.hasOwnProperty('open')) ? !this.state.component.open : true;
    //   this.setState({ component: update(this.state.component, { open: { $set: isOpen }}) });
    // }
  },
  render: function () {
    var self = this;
    var comp = this.props.spec;

    var compId;
    if(comp.hasOwnProperty("@ComponentId"))
      compId = comp["@ComponentId"];
    else if(comp.Header != undefined)
      compId = comp.Header.ID;
    else
      compId = null;

    //console.log('render', this.constructor.displayName, (compId != null) ? compId : 'inline');

    var header = comp.Header;
    var compName = (header != undefined) ? header.Name : comp['@name']; // TODO: use @name attr only

    if(header != undefined && comp.CMD_Component != undefined)
      comp = comp.CMD_Component;

    if($.isArray(comp) && comp.length == 1)
      comp = comp[0];

    var minC = (comp.hasOwnProperty('@CardinalityMin')) ? comp['@CardinalityMin'] : 1;
    var maxC = (comp.hasOwnProperty('@CardinalityMax')) ? comp['@CardinalityMax'] : 1;

    var compProps = (<div>Number of occurrences: {minC + " - " + maxC}</div>);
    var compElems = comp.CMD_Element;

    if(!$.isArray(compElems) && compElems != undefined)
      compElems = [compElems];

    if(compElems != undefined)
      compElems = compElems.map(function(elem, index) {
        //console.log('found elem (' + index + '): ' + elem);
        var elemId = (elem.elemId != undefined) ? elem.elemId : "comp_elem_" + md5.hash("comp_elem_" + elem['@name'] + "_" + index + "_" + Math.floor(Math.random()*1000));
        elem.elemId = elemId;
        return <CMDElementView key={elemId} spec={elem} />
      });

    if(!this.props.open && (compId != null && !comp.hasOwnProperty('@name') && this.props.componentName != null))
       compName = this.props.componentName;
    else if(comp.hasOwnProperty("@name"))
      compName = (comp['@name'] == "") ? "[New Component]" : comp['@name'];

    var compComps = comp.CMD_Component;

    if(!$.isArray(compComps) && compComps != undefined)
      compComps = [compComps];

    if(compComps != undefined)
      compComps = compComps.map(function(nestedComp, ncindex) {
        //console.log('found component (' + ncindex + '): ' + nestedComp);

        var compId;
        if(nestedComp.hasOwnProperty("@ComponentId")) compId = nestedComp['@ComponentId'];
        else if(nestedComp.Header != undefined) compId = nestedComp.Header.ID;
        else compId = (nestedComp.inlineId != undefined) ? nestedComp.inlineId : "inline_" + md5.hash("inline_" + nestedComp['@name'] + "_" + ncindex + "_" + Math.floor(Math.random()*1000));

        var newNestedComp = nestedComp;
        if(compId.startsWith("inline") && nestedComp.inlineId == undefined)
          newNestedComp = update(newNestedComp, { $merge: { inlineId: compId } });

        //console.log('compId: ' + compId);

        return <CMDComponentView key={compId} parent={self.props.spec} spec={nestedComp} />
      });

    // classNames
    var viewClasses = classNames('componentBody', { 'hide': !this.props.open });
    var componentClasses = classNames('CMDComponent', { 'open': this.props.open, 'selected': this.props.isSelected });

    if(comp.AttributeList != undefined) {
      var attrSet = $.isArray(comp.AttributeList.Attribute) ? comp.AttributeList.Attribute : [comp.AttributeList.Attribute];
    }
    var attrList = (
      <div className="attrList">AttributeList:
        {
          (attrSet != undefined && attrSet.length > 0)
          ? $.map(attrSet, function(attr, index) {
            var attrId = (attr.attrId != undefined) ? attr.attrId : "comp_attr_" + md5.hash("comp_attr_" + index + "_" + Math.floor(Math.random()*1000));
            attr.attrId = attrId;
            return <CMDAttributeView key={attrId} spec={attr} />
          })
          : <span> No Attributes</span>
        }
      </div>
    );

    var children = (
      <div className={viewClasses}>
        {attrList}
        <div className="childElements">{compElems}</div>
        <div ref="components" className="childComponents">{compComps}</div>
      </div>
    );

    if(this.props.hideProperties) {
      //skip 'envelope', only show child components, elements, attributes
      return children;
    } else {
      // envelope with properties and children
      return (
        <div className={componentClasses}>
          <span>Component: </span><a className="componentLink" onClick={this.toggleComponent}>{compName}</a>
          <div className="componentProps">{compProps}</div>
          {children}
        </div>
      );
    }
  }
});

module.exports = CMDComponentView;
