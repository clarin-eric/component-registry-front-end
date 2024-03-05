'use strict';
var log = require('loglevel');

var Fluxxor = require("fluxxor"),
    Constants = require("../constants");

var ImmutabilityUtil = require('../util/ImmutabilityUtil');
var ComponentSpec = require('../service/ComponentSpec');
var ItemsFilter = require('../service/ItemsFilter');

var _ = require('lodash');

var remove = ImmutabilityUtil.remove,
    update = ImmutabilityUtil.update;

var changeObj = require('../util/ImmutabilityUtil').changeObj;

var ItemsStore = Fluxxor.createStore({
  initialize: function(options) {
      this.items = [], //items to be shown in browser
      this.filteredItems = [],
      this.removed = {}, //items that have been deleted or are being deleted
      this.loading = false, //loading state
      this.type = Constants.TYPE_PROFILE, //components or profiles
      this.space = Constants.SPACE_PUBLISHED, //private, group, published
      this.team = null;
      this.filterText = null,
      this.sortState = null,
      this.statusFilter = null;

    this.bindActions(
      Constants.LOAD_ITEMS, this.handleLoadItems,
      Constants.LOAD_ITEMS_SUCCESS, this.handleLoadItemsSuccess,
      Constants.LOAD_ITEMS_FAILURE, this.handleLoadItemsFailure,
      Constants.LOAD_ITEM_RIGHTS, this.handleLoadItemRights,
      Constants.LOAD_ITEM_RIGHTS_SUCCESS, this.handleLoadItemRightsSuccess,
      Constants.LOAD_ITEM_RIGHTS_FAILURE, this.handleLoadItemRightsFailure,
      Constants.SWITCH_SPACE, this.handleSwitchSpace,
      Constants.JUMP_TO_ITEM, this.handleJumpToItem,
      Constants.JUMP_TO_ITEM_SUCCESS, this.handleJumpToItemSuccess,
      Constants.JUMP_TO_ITEM_FAILURE, this.handleJumpToItemFailure,
      Constants.DELETE_COMPONENTS, this.handleDeleteOrMove,
      Constants.DELETE_COMPONENTS_SUCCESS, this.handleDeleteOrMoveSuccess,
      Constants.DELETE_COMPONENTS_FAILURE, this.handleDeleteOrMoveFailure,
      Constants.MOVE_TO_TEAM, this.handleDeleteOrMove,
      Constants.MOVE_TO_TEAM_SUCCESS, this.handleDeleteOrMoveSuccess,
      Constants.MOVE_TO_TEAM_FAILURE, this.handleDeleteOrMoveFailure,
      Constants.FILTER_TEXT_CHANGE, this.handleFilterTextChange,
      Constants.SAVE_COMPONENT_SPEC_SUCCESS, this.handleComponentSaved,
      Constants.TOGGLE_SORT_STATE, this.toggleSortState,
      Constants.SET_STATUS_PERMISSION_CHECK, this.handleStatusPermissionCheck,
      Constants.SET_STATUS_PERMISSION_CHECK_DONE, this.handleStatusPermissionCheckDone,
      Constants.SET_STATUS, this.handleSetStatusOrSuccessor,
      Constants.SET_STATUS_SUCCESS, this.handleSetStatusOrSuccessorDone,
      Constants.SET_STATUS_FAILTURE, this.handleSetStatusOrSuccessorDone,
      Constants.SET_SUCCESSOR, this.handleSetStatusOrSuccessor,
      Constants.SET_SUCCESSOR_SUCCESS, this.handleSetStatusOrSuccessorDone,
      Constants.SET_SUCCESSOR_FAILTURE, this.handleSetStatusOrSuccessorDone,
      Constants.SET_STATUS_FILTER, this.handleSetStatusFilter,
      Constants.RESET_STATUS_FILTER, this.handleResetStatusFilter
    );
  },

  getState: function() {
    return {
      items: this.filteredItems,
      deleted: this.removed,
      loading: this.loading,
      type: this.type,
      space: this.space,
      team: this.team,
      filterText: this.filterText,
      sortState: this.sortState,
      filteredSize: this.filteredItems.length,
      unfilteredSize: this.items.length,
      statusFilter: this.statusFilter
    };
  },

  handleLoadItems: function() {
    this.loading = true;
    this.emit("change");
  },

  handleLoadItemsSuccess: function(items) {
    this.items = items;
    this.filteredItems = ItemsFilter.filter(this.items, this.filterText, this.sortState);
    this.loading = false;
    this.removed = {};
    this.emit("change");
  },

  handleLoadItemsFailure: function() {
    this.loading = false;
    this.emit("change");
  },

  handleSwitchSpace: function(spaceType) {
    //any changes? if not, a forced reload may be prevented
    if(spaceType.type !== this.type || spaceType.space !== this.space || spaceType.team != this.team || (spaceType.statusFilter != undefined && spaceType.statusFilter !== this.statusFilter)) {
      this.type = spaceType.type;
      this.space = spaceType.space;
      this.team = spaceType.team;
      if(spaceType.statusFilter === Constants.STATUS_DEFAULT) {
        this.statusFilter = null;
      }
      else if(spaceType.statusFilter !== undefined) {
        log.debug("Setting status filter");
        if(statusFilter != null && !_.isArray(statusFilter)) {
          this.statusFilter = [spaceType.statusFilter];
        } else {
          this.statusFilter = spaceType.statusFilter;
        }
      }
      this.emit("change");
    }
  },

  handleDeleteOrMove: function(ids) {
    this.loading = true;
    for(var i=0; i<ids.length; i++) {
      var id=ids[i];
      this.removed = update(this.removed, changeObj(id, {$set: Constants.DELETE_STATE_DELETING}));
    }
    this.emit("change");
  },

  handleDeleteOrMoveSuccess: function(ids) {
    this.loading = false;
    for(var i=0; i<ids.length; i++) {
      var id=ids[i];
      this.removed = update(this.removed, changeObj(id, {$set: Constants.DELETE_STATE_DELETED}));
    }
    this.emit("change");
  },

  handleDeleteOrMoveFailure: function(result) {
    this.loading = false;
    // remove items from list of deleted items
    this.removed = remove(this.removed, result.ids);
    this.emit("change");
  },

  handleFilterTextChange: function(text) {
    this.filteredItems = ItemsFilter.updateItems(this.items, text, this.filteredItems, this.filterText, this.sortState);
    this.filterText = ItemsFilter.updateFilterText(text);
    this.emit("change");
  },

  handleComponentSaved: function(result) {
    if(result.publish) {
      //switch to public space
      this.space = Constants.SPACE_PUBLISHED;
      this.team = null;
    } else if(!result.update) {
      //new item, saved to private space
      this.space = Constants.SPACE_PRIVATE;
      this.team = null;
    }
    this.type = result.type;
    this.emit("change");
  },

  toggleSortState: function(column) {
    //TODO: move out logic, it is duplicated in EditorStore
    var currentColumn = (this.sortState != null)?this.sortState.column : null;
    var currentOrder= (this.sortState != null)?this.sortState.order : null;
    this.sortState = {
      column: (currentColumn === column && currentOrder === Constants.SORT_ORDER_DESC) ? null : column,
      order: (currentColumn === column && Constants.SORT_ORDER_ASC) ? Constants.SORT_ORDER_DESC : Constants.SORT_ORDER_ASC
    };
    if(this.sortState.column == null) {
      // refilter from items
      this.filteredItems = ItemsFilter.filter(this.items, this.filterText);
    } else {
      this.filteredItems = ItemsFilter.updateItems(this.items, this.filterText, this.filteredItems, this.filterText, this.sortState);
    }
    this.emit("change");
  },

  handleStatusPermissionCheck: function() {
    this.loading = true;
    this.emit("change");
  },

  handleStatusPermissionCheckDone: function() {
    this.loading = false;
    this.emit("change");
  },

  handleSetStatusOrSuccessor: function() {
    this.loading = true;
    this.emit("change");
  },

  handleSetStatusOrSuccessorDone: function() {
    this.loading = false;
    this.emit("change");
  },

  handleSetStatusFilter: function(statusFilter) {
    if(statusFilter != null && !_.isArray(statusFilter)) {
        this.statusFilter = [statusFilter];
    } else {
      this.statusFilter = statusFilter;
    }
    this.emit("change");
  },

  handleResetStatusFilter: function() {
    this.statusFilter = null;
    this.emit("change");
  },

  handleJumpToItem: function() {
    this.loading = true;
    this.emit("change");
  },

  handleJumpToItemSuccess: function() {
    this.loading = false;
    this.emit("change");
  },

  handleJumpToItemFailure: function() {
    this.loading = false;
    this.emit("change");
  },

  handleLoadItemRights: function() {
    this.emit("change");
  },

  handleLoadItemRightsSuccess: function() {
    this.emit("change");
  },

  handleLoadItemRightsFailure: function() {
    this.emit("change");
  }
});

module.exports = ItemsStore;
