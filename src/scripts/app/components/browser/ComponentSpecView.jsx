'use strict';

var React = require('react');
var Constants = require('../../constants');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//components
var CMDComponentView = require('./CMDComponentView');
var ItemLink = require('./ItemLink');

//boostrap
var Alert = require('react-bootstrap/lib/Alert');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//utils
var update = require('react-addons-update');
var classNames = require('classnames');
var md5 = require('spark-md5');

require('../../../../styles/ComponentViewer.sass');

/**
* ComponentViewer - view display for a CMDI Profile or Component item and its root properties, nested Components (CMDComponent), Elements, (CMDElement) and Attributes (CMDAttribute).
* @constructor
*/
var ComponentSpec = React.createClass({
  mixins: [ImmutableRenderMixin],

  propTypes: {
    spec: React.PropTypes.object.isRequired,
    expansionState: React.PropTypes.object,
    linkedComponents: React.PropTypes.object,
    onComponentToggle: React.PropTypes.func,
    warnForDevelopment: React.PropTypes.bool,
    warnForDeprecated: React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      warnForDevelopment: true,
      warnForDeprecated: true,
    };
  },

  getInitialState: function() {
    return { childElements: null,
             childComponents: null
    };
  },

  render: function() {
    var spec = this.props.spec;
    var type = (spec['@isProfile'] == "true") ? Constants.TYPE_PROFILE : Constants.TYPE_COMPONENT;

    if(spec == null)
      return (
        <div className="ComponentViewer loading" />
      );
    else {
      var rootClasses = classNames({ ComponentViewer: true });
      var rootComponent = spec.Component;

      // Determine root spec (should be inline, but may be linked)
      var isLinked = rootComponent.hasOwnProperty("@ComponentRef");
      var rootSpec = null;
      if(isLinked) {
        var compId = rootComponent['@ComponentRef'];
        //linked root component, use full spec for linked components if available (should have been preloaded)
        var linkedSpecAvailable = this.props.linkedComponents != undefined
                      && this.props.linkedComponents.hasOwnProperty(compId);
        if(linkedSpecAvailable) {
          rootSpec = this.props.linkedComponents[compId].Component;
        }
      } else {
        rootSpec = rootComponent;
      }

      // Display properties
      var conceptLink = (rootComponent && rootComponent['@ConceptLink'] != null) ? <li><span>ConceptLink:</span> <a href={rootComponent['@ConceptLink']}>{rootComponent['@ConceptLink']}</a></li> : null;

      return (
          <div className={rootClasses}>
            {this.renderStatusWarning(spec, type)}
            <div className="rootProperties">
              <ul>
                <li><span>Name:</span> <b>{spec.Header.Name}</b></li>
                <li><span>Description:</span> {spec.Header.Description}</li>
                {conceptLink}
                {spec.Header && spec.Header.DerivedFrom &&
                  <li><span>Derived from: <ItemLink itemId={spec.Header.DerivedFrom} type={type}>{spec.Header.DerivedFrom}</ItemLink></span></li>
                }
                {spec.Header && spec.Header.Successor &&
                  <li><span>Successor: <ItemLink itemId={spec.Header.Successor} type={type}>{spec.Header.Successor}</ItemLink></span></li>
                }
              </ul>
            </div>
            {rootSpec == null ? (
              <span>Loading...</span>
            ):(
              <CMDComponentView
                spec={rootSpec}
                hideProperties={!isLinked}
                isLinked={isLinked}
                onToggle={this.props.onComponentToggle}
                expansionState={this.props.expansionState}
                linkedComponents={this.props.linkedComponents}
                titleComponentLink={true}
                />
            )}
            <div className="end">&nbsp;</div>
          </div>
        );
    }
  },

  renderStatusWarning: function(spec, typeConst) {
    var status = spec.Header.Status;
    if(status != null) {
      status = status.toLowerCase()
      var typeName = (typeConst == Constants.TYPE_PROFILE) ? "profile":"component";

      if(this.props.warnForDevelopment && status === Constants.STATUS_DEVELOPMENT.toLowerCase()) {
        return (
          <Alert bsStyle="warning">
            <Glyphicon glyph={Constants.STATUS_ICON_DEVELOPMENT} /><span> </span>
            This {typeName} has the <strong>development status</strong>. This means that it should be considered a draft that may be subject to change. It is advised to <em>not use this {typeName}</em> until it has been given the production status.
          </Alert>
        );
      } else if(this.props.warnForDeprecated && status === Constants.STATUS_DEPRECATED.toLowerCase()) {
        var successor = spec.Header.Successor;
        return (
          <Alert bsStyle="danger">
            <Glyphicon glyph={Constants.STATUS_ICON_DEPRECATED} /><span> </span>
            This {typeName} has been given the <strong>deprecated status</strong> and its usage is <em>not recommended</em>.<span> </span>
            {(successor && successor != '') ?
              <span>Please consider using the assigned <ItemLink itemId={successor} type={typeConst}>successor {typeName}</ItemLink> instead!</span>
              :<span>No successor has been assigned for this {typeName}.</span>
            }
          </Alert>
        );
      }
    }
    return null;
  }
});

module.exports = ComponentSpec;
