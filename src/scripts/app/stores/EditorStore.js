'use strict';
var log = require('loglevel');

var Fluxxor = require("fluxxor"),
    Constants = require("../constants"),
    React = require('react');

var ExpansionState = require("../service/ExpansionState");
var ItemsFilter = require('../service/ItemsFilter');

var update = require('react-addons-update');

var EditorStore = Fluxxor.createStore({
  initialize: function(options) {
    this.type = Constants.TYPE_COMPONENT; //components or profiles
    this.item = null;
    this.itemRights = null;
    this.processing = false;
    this.componentLinkingMode = false;
    this.selectedComponentId = null; //selected for linking
    this.cmdiVersionMode = Constants.CMD_VERSION_1_2;
    this.userOwnsItem = false;

    this.gridSpace = Constants.SPACE_PUBLISHED;
    this.gridTeam = null;
    this.gridItems = [];
    this.filteredGridItems = [];
    this.gridLoading = false;
    this.gridFilterText = null;
    this.gridStatusFilter = null;
    this.gridSortState = null;

    // component spec itself is stored in the component details store for the editor

    this.bindActions(
      Constants.OPEN_EDITOR, this.handleOpenEditor,
      Constants.LOAD_ITEM, this.handleLoadItem,
      Constants.LOAD_ITEM_SUCCESS, this.handleLoadItemSuccess,
      Constants.LOAD_ITEM_FAILURE, this.handleLoadItemFailure,
      Constants.ITEM_UPDATED, this.handleLoadItemSuccess,
      Constants.SAVE_COMPONENT_SPEC, this.handleSave,
      Constants.SAVE_COMPONENT_SPEC_SUCCESS, this.handleSaveDone,
      Constants.SAVE_COMPONENT_SPEC_FAILURE, this.handleSaveDone,
      Constants.SAVE_COMPONENT_SPEC_ABORTED, this.handleSaveDone,
      Constants.LOAD_EDITOR_ITEMS, this.handleLoadGridItems,
      Constants.LOAD_EDITOR_ITEMS_SUCCESS, this.handleLoadGridItemsSuccess,
      Constants.LOAD_EDITOR_ITEMS_FAILURE, this.handleLoadGridItemsFailure,
      Constants.SWITCH_EDITOR_GRID_SPACE, this.handleSwitchGridSpace,
      Constants.GRID_FILTER_TEXT_CHANGE, this.handleFilterTextChange,
      Constants.GRID_TOGGLE_SORT_STATE, this.toggleSortState,
      Constants.START_COMPONENT_LINK, this.handleStartComponentLink,
      Constants.COMPLETE_COMPONENT_LINK, this.handleCompleteComponentLink,
      Constants.RESET_EDITOR_STATUS_FILTER, this.handleResetStatusFilter,
      Constants.SET_EDITOR_STATUS_FILTER, this.handleSetStatusFilter,
      Constants.SET_CMDI_VERSION_MODE, this.handleSetCmdiVersionMode,
      Constants.CHECK_USER_ITEM_OWNSERSHIP_SUCCESS, this.handleCheckUserItemOwnership,
      // Constants.LOAD_ITEM_RIGHTS, this.handleLoadingItemRights,
      Constants.LOAD_ITEM_RIGHTS_SUCCESS, this.handleItemRightsLoaded
    );
  },

  getState: function() {
    // 'singleton' selectedItem associative array
    var selectedItems = {};
    if(this.selectedGridItem != null) {
      selectedItems[this.selectedGridItem.id] = this.selectedGridItem;
    }
    return {
      type: this.type,
      item: this.item,
      itemRights: this.itemRights,
      componentLinkingMode: this.componentLinkingMode,
      selectedComponentId: this.selectedComponentId,
      processing: this.processing,
      cmdiVersionMode: this.cmdiVersionMode,
      userOwnsItem: this.userOwnsItem,
      grid: {
        space: this.gridSpace,
        team: this.gridTeam,
        items: this.filteredGridItems,
        loading: this.gridLoading,
        filterText: this.gridFilterText,
        statusFilter: this.gridStatusFilter,
        sortState: this.gridSortState
      }
    };
  },

  handleOpenEditor: function(obj) {
    this.type = obj.type;

    // reset component linking/selection state
    this.selectedComponentId = null;
    this.componentLinkingMode = false;
    this.userOwnsItem = false; //default, should be checked explicitly

    // reset grid
    this.gridSpace = Constants.SPACE_PUBLISHED
    this.gridTeam = null;
    this.gridItems = [];
    this.emit("change");
  },

  handleLoadItem: function(itemId) {
    this.processing = true;
    this.emit("change");
  },

  handleLoadItemSuccess: function(item) {
    this.processing = false;
    this.item = item
    this.emit("change");
  },

  handleLoadItemFailure: function() {
    this.processing = false;
    this.item = null;
    this.emit("change");
  },

  handleSave: function() {
    this.processing = true;
    this.emit("change");
  },

  handleSaveDone: function() {
    this.processing = false;
    this.emit("change");
  },

  handleSelectGridItem: function(item) {
    this.selectedGridItem = item;
    this.emit("change");
  },

  handleSwitchGridSpace: function(spaceObj) {
    this.gridSpace = spaceObj.space;
    this.gridTeam = spaceObj.team;
    this.emit("change");
  },

  handleStartComponentLink: function(id) {
    this.selectedComponentId = id;
    this.componentLinkingMode = true;
    this.emit("change");
  },

  handleCompleteComponentLink: function() {
    this.componentLinkingMode = false;
    this.emit("change");
  },

  handleLoadGridItems: function() {
    this.gridLoading = true;
    this.emit("change");
  },

  handleLoadGridItemsFailure: function() {
    this.gridLoading = false;
    this.emit("change");
  },

  handleLoadGridItemsSuccess: function(items) {
    this.gridItems = items;
    this.filteredGridItems = ItemsFilter.filter(this.gridItems, this.gridFilterText, this.gridSortState);
    this.gridLoading = false;
    this.emit("change");
  },

  handleFilterTextChange: function(text) {
    this.filteredGridItems = ItemsFilter.updateItems(this.gridItems, text, this.filteredGridItems, this.gridFilterText, this.gridSortState);
    this.gridFilterText = ItemsFilter.updateFilterText(text);
    this.emit("change");
  },

  toggleSortState: function(column) {
    //TODO: move out logic, it is duplicated from ItemsStore
    var currentColumn = (this.gridSortState != null)?this.gridSortState.column : null;
    var currentOrder= (this.gridSortState != null)?this.gridSortState.order : null;
    this.gridSortState = {
      column: (currentColumn === column && currentOrder === Constants.SORT_ORDER_DESC) ? null : column,
      order: (currentColumn === column && Constants.SORT_ORDER_ASC) ? Constants.SORT_ORDER_DESC : Constants.SORT_ORDER_ASC
    };
    if(this.gridSortState.column == null) {
      // refilter from items
      this.filteredGridItems = ItemsFilter.filter(this.gridItems, this.gridFilterText);
    } else {
      this.filteredGridItems = ItemsFilter.updateItems(this.gridItems, this.gridFilterText, this.filteredGridItems, this.gridFilterText, this.gridSortState);
    }
    this.emit("change");
  },

  handleSetStatusFilter: function(statusFilter) {
    if(statusFilter != null && !_.isArray(statusFilter)) {
      this.gridStatusFilter = [statusFilter];
    } else {
      this.gridStatusFilter = statusFilter;
    }
    this.emit("change");
  },

  handleResetStatusFilter: function() {
    this.gridStatusFilter = null;
    this.emit("change");
  },

  handleSetCmdiVersionMode: function(cmdiVersion) {
    this.cmdiVersionMode = cmdiVersion;
    this.emit("change");
  },

  handleCheckUserItemOwnership: function(hasRights) {
    this.userOwnsItem = hasRights;
    this.emit("change");
  },

  handleItemRightsLoaded: function(rights) {
    log.debug("Item rights loaded", rights);
    this.itemRights = rights;
    this.emit("change");
  }

});

module.exports = EditorStore;
