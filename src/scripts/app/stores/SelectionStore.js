'use strict';

var log = require("loglevel");

var Fluxxor = require("fluxxor"),
    Constants = require("../constants");

var ImmutabilityUtil = require('../util/ImmutabilityUtil');
var remove = ImmutabilityUtil.remove,
    update = ImmutabilityUtil.update;

var changeObj = require('../util/ImmutabilityUtil').changeObj;

var SelectionStore = Fluxxor.createStore({
  initialize: function(options) {
    this.selectedItems = {};
    this.allowMultiple = false;
    this.currentItem = null;
    this.currentItemRights = null;

    this.bindActions(
      Constants.SELECT_BROWSER_ITEM, this.handleSelectItem,
      Constants.SWITCH_MULTIPLE_SELECT, this.handleSwitchMultipleSelect,
      Constants.SWITCH_SPACE, this.handleSwitchSpace,
      Constants.DELETE_COMPONENTS_SUCCESS, this.handleDeleteItemsSuccess,
      Constants.SAVE_COMPONENT_SPEC_SUCCESS, this.handleComponentSaved,
      Constants.LOAD_ITEM_RIGHTS, this.handleLoadingItemRights,
      Constants.LOAD_ITEM_RIGHTS_SUCCESS, this.handleItemRightsLoaded
    );
  },

  getState: function() {
    return {
      selectedItems: this.selectedItems,
      allowMultiple: this.allowMultiple,
      currentItem: this.currentItem,
      currentItemRights: this.currentItemRights
    };
  },

  handleSelectItem: function(obj) {
    var item = obj.item;
    var multi = obj.multi;

    this.currentItem = item;
    this.currentItemRights = null;
    this.allowMultiple = (multi === true);

    if(this.allowMultiple) {
      // we may already have a selection, check if we want to unselect
      if(item != null && this.selectedItems[item.id] != null) {
          //special case: unselect
          this.selectedItems = remove(this.selectedItems, item.id);
          this.emit("change");
          return
      }
    } else {
      // only one item can be selected, erase existing selection
      this.selectedItems = {};
    }

    if (item != null) {
      // select identified item
      this.selectedItems = update(this.selectedItems, changeObj(item.id, {$set: item}));
    }
    this.emit("change");
  },

  handleSwitchMultipleSelect: function() {
    this.allowMultiple = !this.allowMultiple;
    this.emit("change");
  },

  handleSwitchSpace: function() {
    // remove selection on space switch
    this.selectedItems = {};
    this.emit("change");
  },

  handleDeleteItemsSuccess: function(ids) {
    log.debug("Removing deleted items from selection");
    // remove deleted items from selection
    this.selectedItems = remove(this.selectedItems, ids);
    this.currentItem = null;
    this.emit("change");
  },

  handleComponentSaved: function(result) {
    //select the newly saved component
    this.allowMultiple = false;
    this.handleSelectItem({item: result.item});
  },

  handleLoadingItemRights: function() {
    this.currentItemRights = null;
    this.emit("change");
  },

  handleItemRightsLoaded: function(rights) {
    log.debug("Item rights loaded", rights);
    this.currentItemRights = rights;
    this.emit("change");
  }

});

module.exports = SelectionStore;
