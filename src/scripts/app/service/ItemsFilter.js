'use strict';
var log = require('loglevel');
var Constants = require("../constants");
var _ = require('lodash');

var ItemsFilter = {
  updateItems: function(items, newFilter, filteredItems, oldFilter, sortState) {
    if(newFilter === oldFilter) {
      // filter unchanged
      return this.sort(_(filteredItems), sortState);
    } else if(newFilter != null && filteredItems != null && oldFilter != null && newFilter.indexOf(oldFilter) == 0) {
      //narrow down on existing filtered items
      return this.filter(filteredItems, newFilter, sortState);
    } else {
      //filter on full set
      return this.filter(items, newFilter, sortState);
    }
  },

  updateFilterText: function(text) {
    return (text === "") ? null : text
  },

  filter: function(items, filter, sortState) {
    log.trace("Filter items", filter, "sort state", sortState);

    if(filter == null) {
      return this.sort(_(items), sortState);
    } else {
      var regex = new RegExp(escapeRegExp(filter), "i");
      return this.sort(_(items).filter(function(item) {
        return regex.test(item.name)
        || regex.test(item.groupName)
        || regex.test(item.description)
        || regex.test(item.creatorName)
        || regex.test(item.id);
      }), sortState);
    }
  },

  /**
   * [function description]
   * @param  {LodashWrapper} items     wrapped array of items
   * @param  {object} sortState with properties 'column' and 'order'
   * @return {Array}           array of items sorted according to sort state
   */
  sort: function(items, sortState) {
    log.trace("Items to sort", items);
    if(sortState == null || sortState.column == null) {
      return items.value();
    } else {
      log.debug("Sort items", items, "by", sortState.column, sortState.order);
      var order = (sortState.order === Constants.SORT_ORDER_DESC) ? 'desc':'asc';
      return items.orderBy([sortState.column], [order]).value();
    }
  }
}

module.exports = ItemsFilter;

function escapeRegExp(str) {
  //http://stackoverflow.com/a/6969486
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
