'use strict';

var React = require("react"),
    Constants = require("../../constants"),
    Fluxxor = require("fluxxor"),
    FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

var Constants = require("../../constants");

//bootstrap
var Tabs = require('react-bootstrap/lib/Tabs');
var Tab = require('react-bootstrap/lib/Tab');

//components
var ComponentSpecView = require('./ComponentSpecView');
var Comments = require('./Comments');
var XmlPanel = require('./XmlPanel');
var Spinner = require('../../util/Spinner');

//helpers
var ComponentSpec = require('../../service/ComponentSpec');
var ExpansionState = require('../../service/ExpansionState');
var ComponentViewMixin = require('../../mixins/ComponentViewMixin');
var classNames = require('classnames');

require('../../../../styles/ComponentDetailsPanel.sass');

/**
* ComponentDetailsPanel - displays the loaded CMDI Profile, full schema and comments in Bootstrap tabbed-panes.
* @constructor
* @mixes ComponentViewMixin
*/
var ComponentDetailsPanel = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin("ComponentDetailsStore", "AuthenticationStore"), ComponentViewMixin],

  // Required by StoreWatchMixin
  getStateFromFlux: function() {
    var flux = this.getFlux();
    return {
      details: flux.store("ComponentDetailsStore").getState(),
      auth: flux.store("AuthenticationStore").getState()
    };
  },

  propTypes: {
    item: React.PropTypes.object,
    type: React.PropTypes.string,
    space: React.PropTypes.string,
    collapsed: React.PropTypes.bool,
    router: React.PropTypes.object.isRequired
  },

  getDefaultProps: function() {
    return {collapsed: false};
  },

  render: function () {
    var item = this.props.item;
    if(item == null) {
      return null;
    }

    var spec = this.state.details.spec;
    var specXml = this.state.details.xml;
    var loading = this.state.details.loading;

    var collapsed = this.props.collapsed;
    var isProfile = ComponentSpec.isProfile(item);
    var classes = classNames("componentInfoPanel", {"loading": loading, "profile": isProfile, "component": !isProfile});

    var loadingSpinner = <Spinner />

    if(this.props.collapsed) {
      return (
        <p className="panelDescription">Component details (hidden)</p>
      )
    } else {
      return (
        <Tabs activeKey={this.state.details.activeView} onSelect={this.refreshTab} className={classes}>
          <Tab eventKey={Constants.INFO_VIEW_SPEC} title="view" disabled={loading}>
            {loadingSpinner}
            {spec != null &&
              <ComponentSpecView
                item={item}
                items={this.props.items}
                spec={spec}
                onComponentToggle={this.doToggle /* from ComponentViewMixin */}
                expansionState={this.state.details.expansionState}
                linkedComponents={this.state.details.linkedComponents}
                warnForDevelopment={this.props.space === Constants.SPACE_PUBLISHED}
                warnForDeprecated={true}
                router={this.props.router}
                />}
          </Tab>
          <Tab id="xmlTab" eventKey={Constants.INFO_VIEW_XML} title="xml" disabled={loading}>
            {loadingSpinner}
            {specXml != null &&
              <XmlPanel xml={specXml} />
            }
          </Tab>
          <Tab id="commentsTab" eventKey={Constants.INFO_VIEW_COMMENTS} title={"Comments (" + this.getCommentsCount() + ")"} disabled={loading}>
            {loadingSpinner}
            {item != null &&
              <Comments
                item={item}
                type={this.props.type}
                loggedIn={this.state.auth.authState.authenticated}
                newComment={this.state.details.newComment}
                comments={this.state.details.comments}
                saveComment={this.saveComment}
                deleteComment={this.deleteComment}
                />}
          </Tab>
        </Tabs>
      );
    }
  },

  refreshTab: function(index) {
    // do a reload depending on selected tab
    if(index === Constants.INFO_VIEW_SPEC) {
      this.props.loadSpec(this.props.item.id);
    }
    if(index === Constants.INFO_VIEW_XML) {
      this.props.loadSpecXml(this.props.item.id);
    }
    if(index == Constants.INFO_VIEW_COMMENTS) {
      this.props.loadComments(this.props.item.id);
    }
  },

  getCommentsCount: function() {
    if(this.state.details.activeView == Constants.INFO_VIEW_COMMENTS) {
      // most accurate IF the current tab is the comments tab (which means that the comments have been loaded)
      return this.state.details.comments.length;
    } else {
      // we got this from the item listing
      return this.props.item.commentsCount;
    }
  },

  saveComment: function(comment) {
    this.getFlux().actions.saveComment(this.props.type, this.props.item.id, comment);
  },

  deleteComment: function(commentId) {
    this.getFlux().actions.deleteComment(this.props.type, this.props.item.id, commentId);
  }

});

module.exports = ComponentDetailsPanel;
