var log = require("loglevel");
var Constants = require("../constants");
var ComponentRegistryClient = require('../service/ComponentRegistryClient');

/**
 * Browser actions
 */
module.exports = {

  selectBrowserItem: function (item, requestMulti) {
    this.dispatch(Constants.SELECT_BROWSER_ITEM, { item: item, multi: requestMulti });
  },

  selectBrowserItemId: function(type, id, space, team) {
    //get item
    ComponentRegistryClient.loadItem(id, function(item) {
      //select
      this.dispatch(Constants.SELECT_BROWSER_ITEM, {item: item});
    }.bind(this), function(err) {
      this.dispatch(Constants.SELECT_BROWSER_ITEM_FAILED, "Failed to load item with ID " + id);
    }.bind(this));
  },

  switchMultipleSelect: function() {
    this.dispatch(Constants.SWITCH_MULTIPLE_SELECT);
  },

  /**
   * Switch to the space defined by type and registry
   * @param  {string} type     Constants.TYPE_PROFILE or Constants.TYPE_COMPONENT
   * @param  {string} registry Constants.SPACE_PRIVATE, Constants.SPACE_PUBLISHED or Constants.SPACE_TEAM
   */
  switchSpace: function(type, space, team) {
    this.dispatch(Constants.SWITCH_SPACE, {type: type, space: space, team: team||null});
  },

  jumpToItem: function(type, itemId) {
    this.dispatch(Constants.JUMP_TO_ITEM);

    //final goal is to look up the space
    lookupSpace(type, itemId)
      .done(
        function(item, space, team, statusFilter) {
          //do not set status filter if it matches the default status for that space
          if(space === Constants.SPACE_PUBLISHED && statusFilter === Constants.STATUS_PRODUCTION
            || (space === Constants.SPACE_PRIVATE || space === Constants.SPACE_TEAM) && statusFilter === Constants.STATUS_DEVELOPMENT) {
            statusFilter = Constants.STATUS_DEFAULT;
          }
          this.dispatch(Constants.SWITCH_SPACE, {
            type: type,
            space: space,
            team: team || null,
            statusFilter: statusFilter});
          this.dispatch(Constants.SELECT_BROWSER_ITEM, {item: item});
          this.dispatch(Constants.JUMP_TO_ITEM_SUCCESS);
        }.bind(this))
      .fail(
        this.dispatch.bind(this, Constants.JUMP_TO_ITEM_FAILURE)
      );
  },

  editItem: function(item) {
    this.dispatch(Constants.EDIT_ITEM);
  },

  setFilterText: function(text) {
    this.dispatch(Constants.FILTER_TEXT_CHANGE, text);
  },

  toggleSortState: function(column) {
    this.dispatch(Constants.TOGGLE_SORT_STATE, column);
  },

  resetStatusFilter: function() {
    this.dispatch(Constants.RESET_STATUS_FILTER);
  },

  setStatusFilter: function(status) {
    this.dispatch(Constants.SET_STATUS_FILTER, status);
  }

};

/**
 * Asynchronous item lookup
 * @param  {[type]} type   type of item to look up (TYPE_PROFILE or TYPE_COMPONENT)
 * @param  {[type]} itemId id of item to lookup
 * @return {Promise}        promise to look up item space and other details, if succesful resolves with {item object, space, [team]}
 */
var lookupSpace = function(type, itemId) {
  var spaceLookup = $.Deferred();

  //look up item details, space lookup may not require further requests
  var handleSuccess = function(item) {
    log.debug("Target item data:", item);

    var status = Constants.STATUS_WILDCARD;
    if(item.status != null) {
      var statusString = item.status.toLowerCase();
      if(statusString === Constants.STATUS_DEVELOPMENT)
        status = Constants.STATUS_DEVELOPMENT;
      else if(statusString === Constants.STATUS_DEPRECATED)
        status = Constants.STATUS_DEPRECATED;
      else if(statusString === Constants.STATUS_PRODUCTION)
        status = Constants.STATUS_PRODUCTION;
    }

    if(item.isPublic === 'true') {
      //public implies null team, space lookup also done
      spaceLookup.resolve(item, Constants.SPACE_PUBLISHED, null /*no team*/, status);
    } else {
      //a lookup of teams is required to distinguish between private and team
      lookupTeam(type, itemId)
        .done(
          //succesful team lookup
          function(teamId) {
            if(teamId == null) {
              spaceLookup.resolve(item, Constants.SPACE_PRIVATE, null /*no team*/, status);
            } else {
              spaceLookup.resolve(item, Constants.SPACE_TEAM, teamId, status);
            }
          }
        ).fail(
          //team lookup failed
          spaceLookup.reject
        );
    }
  }.bind(this);

  ComponentRegistryClient.loadItem(itemId, handleSuccess, spaceLookup.reject);
  return spaceLookup.promise();
}

/**
 * Asynchronous team ID lookup for an item
 * @param  {[type]} type   type of item to look up for (TYPE_PROFILE or TYPE_COMPONENT)
 * @param  {[type]} itemId id of item to lookup for
 * @return {[type]}        promise to look up item space and other details, if succesful resolves with team id (or null if not in any team)
 */
var lookupTeam = function(type, itemId) {
  var teamLookup = $.Deferred();

  var handleSuccess = function(teamData) {
    log.debug("Target item team data:", teamData);
    //we have the team information...
    if(teamData == null || $.isArray(teamData) && teamData.length == 0) {
      //no data? item not in team, so
      teamLookup.resolve(null);
    } else {
      if($.isArray(teamData)) {
        var team = teamData[0];
      } else {
        var team = teamData;
      }
      if(team != null && team.id != null) {
        teamLookup.resolve(team.id);
      } else {
        teamLookup.reject("Invalid team information, could not jump to item");
      }
    }
  }.bind(this);

  ComponentRegistryClient.loadItemGroups(itemId, handleSuccess, teamLookup.reject);
  return teamLookup.promise();
}
