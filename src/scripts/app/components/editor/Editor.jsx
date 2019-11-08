'use strict';

var log = require('loglevel');

var React = require("react"),
    Constants = require("../../constants"),
    Fluxxor = require("fluxxor"),
    FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

var EditorForm = require("./EditorForm"),
    DataGrid = require("../datagrid/DataGrid.jsx"),
    SpaceSelector = require("../datagrid/SpaceSelector.jsx"),
    DataGridFilter = require("../datagrid/DataGridFilter.jsx");

var PanelExpandCollapseButton = require('../PanelExpandCollapseButton');

var ComponentViewMixin = require('../../mixins/ComponentViewMixin');

var AuthUtil = require('../AuthState').AuthUtil;
var ReactAlert = require('../../util/ReactAlert');

var withRouter = require('react-router').withRouter;

var classNames = require('classnames');

require('../../../../styles/ComponentEditor.sass');

/**
* Editor - main editor component and route handler for editor subroutes
* Has two "parts": the editor form (encapsulated in a single child component
* 'EditorForm') and the data grid plus controls.
* @constructor
*/
var Editor = React.createClass({
  mixins: [FluxMixin, ComponentViewMixin,
            StoreWatchMixin("AuthenticationStore","ComponentDetailsStore", "EditorStore", "TeamStore")],

  // Required by StoreWatchMixin
  getStateFromFlux: function() {
    var flux = this.getFlux();
    return {
      auth: flux.store("AuthenticationStore").getState(),
      items: flux.store("ItemsStore").getState(),
      details: flux.store("ComponentDetailsStore").getState(),
      editor: flux.store("EditorStore").getState(),
      team: flux.store("TeamStore").getState()
    };
  },

  getInitialState: function() {
    return { expandedGrid: false };
  },

/*
  componentWillMount: function() {
    // https://github.com/clarin-eric/component-registry-front-end/issues/17
    this.props.router.setRouteLeaveHook(
      this.props.route,
      () => {return "Leave?"} //TODO: ok if on save, cancel or publish
    )
  },
*/

  componentDidMount: function() {
    if(!this.isAuthenticated()) {
      log.debug("Editor requires authentication");
      // if(!AuthUtil.triggerLogin()) {
      //   alert("Please authenticate manually by pressing the login button");
      //   log.warn("Could not trigger login, login form not found on page");
      // }
    }

    //init editor state, load component etc based on router parameters
    this.initFromParams();

    //initialisation for data grid
    this.getFlux().actions.checkUserItemOwnership(this.state.editor.item, this.state.auth.authState);
    this.getFlux().actions.loadTeams();
    this.getFlux().actions.loadEditorGridItems(this.state.editor.grid.space, this.state.editor.grid.team, this.state.editor.grid.statusFilter);
  },

  componentDidUpdate: function(prevProps, prevState) {
    if(this.state.editor.grid.statusFilter != prevState.editor.grid.statusFilter
        || this.state.editor.grid.space != prevState.editor.grid.space
        || this.state.editor.grid.team != prevState.editor.grid.team
    ) {
      this.getFlux().actions.loadEditorGridItems(this.state.editor.grid.space, this.state.editor.grid.team, this.state.editor.grid.statusFilter);
    }
    if(this.state.editor.item != prevState.editor.item) {
      this.getFlux().actions.checkUserItemOwnership(this.state.editor.item, this.state.auth.authState);
    }
  },

  render: function () {
    return (
      <section id="editor">
        {this.renderContent()}
      </section>
    );
  },

  renderContent: function() {
    var gridDisabled = !this.state.editor.componentLinkingMode;
    var gridExpanded = this.state.expandedGrid || this.state.editor.componentLinkingMode;
    if(this.isAuthenticated()) {
      return (
          <div className={classNames("editorContainer", "row", {"expandedGrid": gridExpanded})}>
            <EditorForm
                item={this.state.editor.item}
                type={this.state.editor.type}
                spec={this.state.details.spec}
                loading={this.state.details.loading}
                processing={this.state.editor.processing}
                expansionState={this.state.details.expansionState}
                linkedComponents={this.state.details.linkedComponents}
                selectedComponentId={this.state.editor.selectedComponentId}
                isNew={this.isNew()}
                componentLinkingMode={this.state.editor.componentLinkingMode}
                onComponentToggle={this.doToggle /* from ComponentViewMixin */}
                derivedFromId={this.state.editor.item == null ? null : this.state.editor.item.id}
                cmdiVersionMode={this.state.editor.cmdiVersionMode}
                onCmdiVersionModeChange={this.handleCmdiVersionModeChange}
                userHasSaveRights={this.state.editor.userOwnsItem}
              />
            <div className={"browserGroup space-" + this.state.editor.grid.space}>
              {gridExpanded && (
                <DataGrid
                  multiSelect={false}
                  editMode={true}
                  items={this.state.editor.grid.items}
                  loading={this.state.editor.grid.loading}
                  onRowSelect={this.handleGridRowSelect}
                  sortState={this.state.editor.grid.sortState}
                  onToggleSort={this.toggleGridSort}
                  disabled={gridDisabled}
                  />
              )}
              <div className="gridControls">
                <PanelExpandCollapseButton
                  title="Expand/collapse components table"
                  expanded={gridExpanded}
                  onClick={this.toggleGridExpansion}
                  disabled={this.state.editor.componentLinkingMode} />
                {gridExpanded && (
                  <DataGridFilter
                    value={this.state.editor.grid.filterText}
                    onChange={this.handleGridFilterTextChange}
                    />
                )}
                {gridExpanded && (
                  <SpaceSelector
                    type={Constants.TYPE_COMPONENT}
                    space={this.state.editor.grid.space}
                    teams={this.state.team.teams}
                    selectedTeam={this.state.editor.grid.team}
                    statusFilter={this.state.editor.grid.statusFilter}
                    onStatusFilterToggle={this.handleStatusFilterToggle}
                    onStatusFilterReset={this.handleStatusFilterReset}
                    allowMultiSelect={false}
                    validUserSession={true}
                    componentsOnly={true}
                    onSpaceSelect={this.handleGridSpaceSelect}
                    onToggleMultipleSelect={null}
                    privateAllowed={this.state.items.space === Constants.SPACE_PRIVATE /* allow to select from private iff current space is private */}
                    allowedTeamIds={
                      this.state.items.space === Constants.SPACE_TEAM ? [this.state.items.team] /* allow to select from current team only */
                        : [] /* not in team space - do not allow selection from any team */
                    }
                     />
                )}
                {gridDisabled ?
                  (<p className="gridInstructions">To link in an existing a component, click <em>+Component</em> on the target component above</p>)
                  :(<p className="gridInstructions">
                      Click the <em>+</em> button next to the component you want to link in from the table below
                      (<a onClick={function(){this.getFlux().actions.cancelComponentLink()}.bind(this)}>cancel</a>)
                    </p>)
                  }
              </div>
            </div>
          </div>
        );
    } else {
      // on mount, login should be triggered
      return <div>Login required to edit</div>;
    }
  },

  handleGridSpaceSelect: function(type, space, team) {
    if(space != this.state.editor.grid.space || team != this.state.editor.grid.team) {
      this.getFlux().actions.resetGridStatusFilter();
    }
    this.getFlux().actions.switchEditorGridSpace(space, team);
  },

  handleGridFilterTextChange: function(evt) {
    this.getFlux().actions.setGridFilterText(evt.target.value);
  },

  toggleGridSort: function(column) {
    this.getFlux().actions.toggleGridSortState(column);
  },

  handleGridRowSelect: function(itemId) {
    var targetComponentId = this.state.editor.selectedComponentId;
    if(targetComponentId == null) {
      //no selection? add to root component
      targetComponentId = this.state.details.spec.Component._appId;
    }
    // row selected means item should be added to selected component
    this.getFlux().actions.insertComponentById(this.state.details.spec, targetComponentId, itemId,
      function(newSpec) {
        // make sure the newly added linked component is loaded
        this.getFlux().actions.loadLinkedComponentSpecs(newSpec, this.state.details.linkedComponents);
      }.bind(this),
      function(error) {
        ReactAlert.showMessage("Cannot link component", error);
      }
    );
  },

  handleStatusFilterToggle: function(status) {
    this.getFlux().actions.toggleGridStatusFilter(status);
  },

  handleStatusFilterReset: function(status) {
    this.getFlux().actions.resetGridStatusFilter();
  },

  toggleGridExpansion: function() {
    this.setState({expandedGrid: !this.state.expandedGrid});
  },

  handleCmdiVersionModeChange: function(version) {
    this.getFlux().actions.setCmdiVersionMode(version);
  },

  isAuthenticated: function() {
    return this.state.auth.authState.authenticated;
  },

  isNew: function() {
    var routes = this.props.routes;
    if(routes.length == 0) {
      log.error("No routes");
    }

    var path = routes[routes.length - 1].path;
    if(path == null) {
      log.error("No path for route", lastRoute);
    }
    return path.indexOf("editor/new") == 0 || path.indexOf("editor/component/new") == 0 || path.indexOf("editor/profile/new") == 0;
  },

  initFromParams: function() {
    var params = this.props.params;
    log.debug("Editor - location:", this.location, "params:", params);

    // set application state through actions, after this avoid using params directly

    // determine id - take either from componentId or profileId
    // may be null in case of a new item
    var id = params.componentId;
    if(id == undefined) {
      id = params.profileId;
    }

    // determine type
    var type;
    if(params.type != undefined) {
      type = params.type;
    } else if (params.componentId != undefined) {
      type = Constants.TYPE_COMPONENT;
    } else if (params.profileId != undefined) {
      type = Constants.TYPE_PROFILE;
    } else {
      log.error("Unknown type for editor", params);
    }

    var space = params.space;

    // initialise editor
    this.getFlux().actions.openEditor(type, space, id);

    // further initialisation of the editor depending on parameters
    if(this.isNew() && id == undefined) {
      log.debug("Creating new ", type);
      // create new component
      this.getFlux().actions.newComponentSpec(type, space);
      // create new item description
      this.getFlux().actions.newItem(type, space);
    } else {
      log.debug("Loading ", type, id);
      // load the spec for editing
      this.getFlux().actions.loadComponentSpec(type, id);
      // load the item for editing
      this.getFlux().actions.loadItem(type, id);
    }
  }
});

module.exports = Editor;
