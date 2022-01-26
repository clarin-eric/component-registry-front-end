'use strict';
var log = require("loglevel");

var React = require('react');
var Constants = require('../../constants');
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//components
var CMDComponentView = require('./CMDComponentView');
var ComponentInfo = require('./ComponentInfo')
var DocumentationView = require('./DocumentationView');
var ItemLink = require('./ItemLink');

var ReactAlert = require('../../util/ReactAlert');

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
  mixins: [FluxMixin, ImmutableRenderMixin],

  propTypes: {
    item: React.PropTypes.object.isRequired,
    items: React.PropTypes.object.isRequired,
    spec: React.PropTypes.object.isRequired,
    expansionState: React.PropTypes.object,
    linkedComponents: React.PropTypes.object,
    onComponentToggle: React.PropTypes.func,
    warnForDevelopment: React.PropTypes.bool,
    warnForDeprecated: React.PropTypes.bool,
    showNoticeIfRecommended: React.PropTypes.bool,
    router: React.PropTypes.object.isRequired
  },

  getDefaultProps: function() {
    return {
      warnForDevelopment: true,
      warnForDeprecated: true,
      showNoticeIfRecommended: true
    };
  },

  getInitialState: function() {
    return { childElements: null,
             childComponents: null
    };
  },

  showComponentInfo: function() {
    ReactAlert.showModalAlert(
      "Info for " + this.props.item.name,
      <ComponentInfo
          className="modal-desc component-info"
          item={this.props.item}
          type={this.props.items.type}
          space={this.props.items.space}
          team={this.props.items.team}
          router={this.props.router}
           />
    );
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
      var conceptLink = (rootComponent && rootComponent['@ConceptLink'] != null) ? <li><span className="propertyLabel">ConceptLink: </span><span><a href={rootComponent['@ConceptLink']}>{rootComponent['@ConceptLink']}</a></span></li> : null;

      return (
          <div className={rootClasses}>
            {this.renderRecommendedNotice(this.props.item, type)}
            {this.renderStatusWarning(spec, type)}
            <div className="rootProperties">
              <ul>
                <li><span className="propertyLabel">Name:</span> <span><b>{spec.Header.Name}</b></span></li>
                <li><span className="propertyLabel">Description:</span> <span>{spec.Header.Description}</span></li>
                {conceptLink}
                {spec.Header && spec.Header.DerivedFrom &&
                  <li><span className="propertyLabel">Derived from:</span> <span><ItemLink itemId={spec.Header.DerivedFrom} type={type}>{spec.Header.DerivedFrom}</ItemLink></span></li>
                }
                {spec.Header && spec.Header.Successor &&
                  <li><span className="propertyLabel">Successor:</span> <span><ItemLink itemId={spec.Header.Successor} type={type}>{spec.Header.Successor}</ItemLink></span></li>
                }
                {rootSpec['Documentation'] &&
                  <li><span className="propertyLabel">Documentation: </span><div className="rootSpecDocumentation"><DocumentationView value={rootSpec['Documentation']} /></div></li>
                }
                <li><span className="propertyLabel">Info &amp; links: </span> <span><a onClick={this.showComponentInfo}><Glyphicon glyph="info-sign" /></a></span></li>
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

  renderRecommendedNotice: function(item, typeConst) {
    var recommended = (item.recommended === 'true');
    if(recommended && this.props.showNoticeIfRecommended) {
      log.debug('Recommend item: ', item);
      var typeName = (typeConst == Constants.TYPE_PROFILE) ? "profile":"component";
      return (
        <Alert bsStyle="info">
          <Glyphicon glyph={Constants.STATUS_ICON_RECOMMENDED} /><span> </span>
          This {typeName} has the <strong>recommended</strong> status.
          If you can, consider using this {typeName} rather than using an alternative or making your own.
          This ensures that the metadata based on the {typeName} can be used, displayed and processed optimally within the CLARIN infrastructure.
        </Alert>
      );
    } else {
      // not a recommended item
      return null;
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
