var log = require('loglevel');

var _ = require('lodash');

var SpecAugmenter = require("../service/SpecAugmenter");
var update = require('react-addons-update');

var Constants = require("../constants"),
    /* REST client */
    ComponentRegistryClient = require("../service/ComponentRegistryClient"),
    /* Component spec utils */
    ComponentSpec = require("../service/ComponentSpec");

var RestActions = {
  loadItems: function(type, space, team, statusFilter) {
    this.dispatch(Constants.LOAD_ITEMS);
    ComponentRegistryClient.loadComponents(type, space, team, statusFilter, function(items){
        // Success
        this.dispatch(Constants.LOAD_ITEMS_SUCCESS, items);
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.LOAD_ITEMS_FAILURE, message);
      }.bind(this)
    );
  },

  loadEditorGridItems: function(space, team, statusFilter) {
    this.dispatch(Constants.LOAD_EDITOR_ITEMS);
    ComponentRegistryClient.loadComponents(Constants.TYPE_COMPONENT, space, team, statusFilter, function(items){
        // Success
        this.dispatch(Constants.LOAD_EDITOR_ITEMS_SUCCESS, items);
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.LOAD_EDITOR_ITEMS_FAILURE, message);
      }.bind(this)
    );
  },

  loadItem: function(type, itemId) {
    this.dispatch(Constants.LOAD_ITEM, itemId);
    ComponentRegistryClient.loadItem(itemId, function(item){
        // Success
        this.dispatch(Constants.LOAD_ITEM_SUCCESS, item);
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.LOAD_ITEM_FAILURE, message);
      }.bind(this)
    );
  },

  loadComponentSpec: function(type, itemId, successCb) {
    this.dispatch(Constants.LOAD_COMPONENT_SPEC);
    // load the (JSON) spec for this item
    ComponentRegistryClient.loadSpec(type, itemId, "json", function(spec){
        // Success. Now also load linked child components at root level, we need
        // their names for display purposes.
        loadLinkedComponents(spec, function(linkedComponents) {
          // Loading of linked components done...
          SpecAugmenter.augmentWithIds(spec);
          log.trace("Loaded and augmented spec: ", spec);
          this.dispatch(Constants.LOAD_COMPONENT_SPEC_SUCCES, {spec: spec, linkedComponents: linkedComponents});
          if(successCb) {
            successCb(spec);
          }
        }.bind(this));
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.LOAD_COMPONENT_SPEC_FAILURE, message);
      }.bind(this)
    );
  },

  /**
   * Loads all linked components in the specified spec
   * Dispatches Constants.LINKED_COMPONENTS_LOADED when done loading
   * @param  {[type]} parentSpec spec to load linked components for
   * @param  {Object} [currentset]     set of already loaded linked components (these will not be loaded again)
   */
  loadLinkedComponentSpecs: function(parentSpec, currentset) {
    loadLinkedComponents(parentSpec, function(linkedComponents) {
      this.dispatch(Constants.LINKED_COMPONENTS_LOADED, linkedComponents);
    }.bind(this), currentset);
  },

  /**
   * Loads a set of components by id as linked components
   * Dispatches Constants.LINKED_COMPONENTS_LOADED when done loading
   * @param {Array} ids of items to be loaded as linked components
   */
  loadLinkedComponentSpecsById: function(ids) {
    loadComponentsById(ids, {}, function(linkedComponents) {
      this.dispatch(Constants.LINKED_COMPONENTS_LOADED, linkedComponents);
    }.bind(this));
  },

  loadComponentSpecXml: function(type, itemId) {
    this.dispatch(Constants.LOAD_COMPONENT_SPEC);
    ComponentRegistryClient.loadSpec(type, itemId, "text", function(specXml){
        // success
        this.dispatch(Constants.LOAD_COMPONENT_SPEC_XML_SUCCES, specXml);
      }.bind(this),
      function(message) {
        // failure
        this.dispatch(Constants.LOAD_COMPONENT_SPEC_FAILURE, message);
      }.bind(this)
    );
  },

  saveComponentSpec: function(spec, item, successCb, componentInUsageCb) {
    // do update, don't publish
    var update = true;
    var publish = false;

    var onSuccess = dispatchSaveSpec.bind(this, this.dispatch, update, publish, successCb);
    saveSpec.apply(this, [spec, item, update, publish, onSuccess, componentInUsageCb])
  },

  saveNewComponentSpec: function(spec, item, successCb) {
    // new, don't update or publish
    var update = false;
    var publish = false;

    var onSuccess = dispatchSaveSpec.bind(this, this.dispatch, update, publish, successCb);
    saveSpec.apply(this, [spec, item, update, publish, onSuccess])
  },

  publishItems: function(type, items, status, successCb) {
    //publish
    var update = true;
    var publish = true;

    //success callback *overrides* default callback for publish action (can happen outside the editor)
    var onSuccess = successCb || dispatchSaveSpec.bind(this, this.dispatch, update, publish, successCb);

    log.debug("Publish items of type", type, items, status, successCb);
    var ids = Object.keys(items);
    if(ids.length > 0) {
      var id = ids[0];
      var item = items[id];
      var spec = ComponentRegistryClient.loadSpec(
        type, id, "json",
        function(spec) {
          log.debug("Publish item with retrieved spec", spec);
          //publish
          // get updated version of spec with requested target status
          var specWithStatus = updateSpecStatus(spec, status);
          if(specWithStatus) {
            log.debug("Publishing item", item, spec);
            // do update and publish
            saveSpec.apply(this, [specWithStatus, item, true, true, function() {
                //TODO: if items left, publish next - else, call success cb
                onSuccess();
            }]);
          }
        }.bind(this)
      );
    }
  },

  publishComponentSpec: function(spec, status, item, successCb) {
    var update = true;
    var publish = true;

    var onSuccess = dispatchSaveSpec.bind(this, this.dispatch, update, publish, successCb);

    // get updated version of spec with requested target status
    var specWithStatus = updateSpecStatus(spec, status);
    if(specWithStatus) {
      // do update and publish
      log.debug("Publishing item", item, spec);
      saveSpec.apply(this, [specWithStatus, item, update, publish, successCb])
      return true;
    } else {
      return false;
    }
  },

  deleteComponents: function(type, ids, componentInUsageCb) {
    log.debug("Requesting deletion of", ids);
    this.dispatch(Constants.DELETE_COMPONENTS, ids);
    deleteComponents(type, ids, function(deletedIds){
      this.dispatch(Constants.DELETE_COMPONENTS_SUCCESS, deletedIds);
    }.bind(this), function(result) {
      if(result.message != null) {
        log.warn("Error while deleting: ", result);
      }
      if(result.message === null || _.trim(result.message) === "") {
        result.message = "Could not delete";
      }
      this.dispatch(Constants.DELETE_COMPONENTS_FAILURE, result);
    }.bind(this), componentInUsageCb);
  },

  loadTeams: function() {
    ComponentRegistryClient.loadTeams(function(teams){
        this.dispatch(Constants.LOAD_TEAMS, teams);
      }.bind(this),
      function(message){
        log.error("Failed to load user teams", message);
        this.dispatch(Constants.LOAD_TEAMS, null);
      }.bind(this)
    );
  },

  moveComponentsToTeam: function(ids, teamId, successCb) {
    log.debug("Requesting moving of", ids);
    this.dispatch(Constants.MOVE_TO_TEAM, ids);
    moveComponentsToTeam(ids, teamId, function(movedIds){
      this.dispatch(Constants.MOVE_TO_TEAM_SUCCESS, movedIds);
      if(successCb) {
        successCb(ids);
      }
    }.bind(this), function(result) {
      if(result.message != null) {
        log.error(result.message);
      }
      this.dispatch(Constants.MOVE_TO_TEAM_FAILURE, result);
    }.bind(this));
  },

  loadComments: function(type, componentId) {
    this.dispatch(Constants.LOAD_COMMENTS);
    ComponentRegistryClient.loadComments(componentId, type, function(comments){
        // Success
        this.dispatch(Constants.LOAD_COMMENTS_SUCCESS, comments);
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.LOAD_COMMENTS_FAILURE, message);
      }.bind(this)
    );
  },

  saveComment: function(type, componentId, comment) {
    this.dispatch(Constants.SAVE_COMMENT, comment);
    ComponentRegistryClient.saveComment(componentId, type, comment, function(result){
        // Success
        this.dispatch(Constants.SAVE_COMMENT_SUCCESS, result);
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.SAVE_COMMENT_FAILURE, message);
      }.bind(this)
    );
  },

  deleteComment: function(type, componentId, commentId) {
    ComponentRegistryClient.deleteComment(componentId, type, commentId, function(id, result){
        // Success
        this.dispatch(Constants.DELETE_COMMENT_SUCCESS, id);
      }.bind(this),
      function(message) {
        // Failure
        this.dispatch(Constants.DELETE_COMMENT_FAILURE, message);
      }.bind(this)
    );
  },

  checkAuthState: function() {
    log.trace("Checking authentication state...");
    ComponentRegistryClient.getAuthState(function(authState){
      if(authState != null) {
        log.trace("Auth state:", authState);
        this.dispatch(Constants.CHECK_AUTH_STATE, authState);
      } else {
        this.dispatch(Constants.CHECK_AUTH_STATE, {uid: null});
      }
    }.bind(this), function(message){
      //TODO: dispatch so that store knows auth state is not up to date?
      log.error(message);
    });
  },

  checkUpdateRights: function(item, authState, onAllowed, onDisallowed) {
    checkUpdateRights(this.dispatch, item, authState, onAllowed, onDisallowed);
  },

  checkUserItemOwnership: function(item, authState) {
    var dispatch = this.dispatch;
    if(item == null) {
      log.debug("No item, cannot be owned");
      dispatch(Constants.CHECK_USER_ITEM_OWNSERSHIP_SUCCESS, false);
    } else {
      checkUpdateRights(dispatch, item, authState,
        function() {
          log.debug("User has update rights");
          dispatch(Constants.CHECK_USER_ITEM_OWNSERSHIP_SUCCESS, true);
        },
        function() {
          log.debug("User does NOT have update rights");
          dispatch(Constants.CHECK_USER_ITEM_OWNSERSHIP_SUCCESS, false);
        }
      )
    }
  },

  updateComponentStatus: function(item, type, targetStatus, cb) {
    this.dispatch(Constants.SET_STATUS, item);
    ComponentRegistryClient.setStatus(item.id, type, targetStatus, function() {
      log.debug("Status of", type, item.id, "updated to", targetStatus);
      this.dispatch(Constants.SET_STATUS_SUCCESS, item);
      if(cb != null) {
        cb();
      }
    }.bind(this), function(errorMessage) {
      log.error("Failed updating status of", type, item.id, "to", targetStatus, ":", errorMessage);
      this.dispatch(Constants.SET_STATUS_FAILTURE, errorMessage);
    }.bind(this));
  },

  updateComponentSuccessor: function(item, type, successorId, cb) {
    this.dispatch(Constants.SET_SUCCESSOR, item);
    ComponentRegistryClient.setSuccessor(item.id, type, successorId, function() {
      log.debug("Successor of", type, item.id, "updated to", successorId);
      this.dispatch(Constants.SET_SUCCESSOR_SUCCESS, item);
      if(cb != null) {
        cb();
      }
    }.bind(this), function(errorMessage) {
      log.error("Failed setting successor of", type, item.id, "to", successorId, ":", errorMessage);
      this.dispatch(Constants.SET_SUCCESSOR_FAILTURE, errorMessage);
    }.bind(this));
  }
};

module.exports = RestActions;

// HELPER FUNCTIONS

function ensureArray(item) {
  if(item == null || _.isArray(item)) {
    return item;
  } else {
    return [item];
  }
}

/**
 * Loads all linked components (with @ComponentRef) that are a direct child
 * of the provided component (JSON spec). When done, the callback is called with
 * the result - this is guaranteed to happen.
 * @param  {object}   component component specification to load linked components for
 * @param  {Function} callback  will be called with the list of loaded components
 * @param  {Object} [currentset={}]  set of already loaded linked components (these will not be loaded again)
 */
function loadLinkedComponents(component, callback, currentset) {
    var components = {};
    var childComponents = component.Component;
    if(currentset == undefined) {
      currentset = {};
    }

    // gather linked component IDs
    if(childComponents != undefined) {
      var linkedComponentIds = getComponentIds(childComponents, currentset);
      loadComponentsById(linkedComponentIds, components, callback);
    } else {
      // no child components, nothing to do so call callback immediately
      callback(components);
    }
}

/**
 * recursively gets the IDs of all
 * @param  {Array} childComponents child objects of type Component
 * @param  {Object} currentset     set of already loaded linked components (these will not be loaded again)
 * @return {Array}                 IDs of linked (non-inline) components
 */
function getComponentIds(childComponents, currentset) {
  var linkedComponentIds = [];

  //make sure we're dealing with an array
  if(!$.isArray(childComponents)) {
    childComponents = [childComponents];
  }

  childComponents.forEach(function(child) {
    var childId = child['@ComponentRef'];
    if(childId != undefined && !currentset.hasOwnProperty(childId)) {
      linkedComponentIds.push(childId);
    } else if(child.Component != undefined) {
      //add linked component IDs in inline children (recursively)
      Array.prototype.push.apply(linkedComponentIds, getComponentIds(child.Component, currentset));
    }
  });
  return linkedComponentIds;
}

/**
 * Loads components with specified ids. When done, the callback is called with
* the result - this is guaranteed to happen.
 * @param  {[Array]}   ids       array with ids to load
 * @param  {[Object]}   collected collected specs thus far
 * @param  {Function} callback  gets called with result when all components have been loaded
 */
function loadComponentsById(ids, collected, callback) {
  var id = ids.pop();
  if(id == undefined) {
    //tail of recursion
    callback(collected);
  } else if(collected[id] != undefined) {
    // already loaded, skip this one and continue
    loadComponentsById(ids, collected, callback);
  } else {
    // load current id
    ComponentRegistryClient.loadSpec(Constants.TYPE_COMPONENT, id, "json", function(spec){
        log.debug("Loaded", id, ":", spec.Header.Name);

        if(spec == undefined) {
          log.warn("LoadSpec returned undefined. Id:", id);
        }

        SpecAugmenter.augmentWithIds(spec);

        //success
        collected[id] = spec;
        // proceed
        loadComponentsById(ids, collected, callback);
      },
      function(message) {
        // failure
        log.warn("Failed to load child component with id ", id, ": ", message);
        // proceed (nothing added this round but continue with rest)
        loadComponentsById(ids, collected, callback);
      }
    );
  }
}

/**
 * Saves a spec while checking for component usage (if callback is provided)
 * @param  {[type]} spec               [description]
 * @param  {[type]} item               [description]
 * @param  {[type]} update             [description]
 * @param  {[type]} publish            [description]
 * @param  {[type]} successCb          [description]
 * @param  {[type]} componentInUsageCb Optional callback called if component is in use
 * @return {[type]}                    [description]
 */
function saveSpec(spec, item, update, publish, successCb, componentInUsageCb) {
  log.debug("Save - update:", update, " publish:", publish);
  this.dispatch(Constants.SAVE_COMPONENT_SPEC);

  // to be called when save is eventually safe and/or confirmed
  var save = function() {
    ComponentRegistryClient.saveComponent(spec, item, item.id, update, publish, function(result){
        // success
        if(successCb) {
          var type = (result["@isProfile"] === "true")?Constants.TYPE_PROFILE:Constants.TYPE_COMPONENT;
          successCb(spec, result.description, type);
        }
      }.bind(this),
      function(message, data) {
        // failure
        log.warn("Error while saving:", message, data);
        this.dispatch(Constants.SAVE_COMPONENT_SPEC_FAILURE, message);
      }.bind(this)
    );
  }.bind(this);

  // to be called when the user aborts the save action (i.e. does not confirm after usage warning)
  var abort = function() {
    log.debug("Saving of component aborted after usage check");
    this.dispatch(Constants.SAVE_COMPONENT_SPEC_ABORTED);
  }.bind(this);

  // Almost ready to try saving...
  if(componentInUsageCb == null // No callback means no usage check
    || ComponentSpec.isProfile(spec)) { // Profile, no usage check required so save
    save();
  } else {
      // Component, may be in use so check
      ComponentRegistryClient.usageCheck(item.id, function(result) {
        // result is null if not in use, otherwise has a list of profile and component descriptions
        if(result == null) {
          log.debug("Component not in use, saving without confirmation...");
          save();
        } else {
          log.debug("Component", item.id, "is in use:", result);

          var resultObj = [];
          if(result.profileDescription)
            resultObj.push({ componentId: item.id, result: result.profileDescription });
          if(result.componentDescription)
            resultObj.push({ componentId: item.id, result: result.componentDescription });
          componentInUsageCb(resultObj, save, abort);
        }
      });
  }
}

function dispatchSaveSpec(dispatch, update, publish, successCb, spec, item, type) {
  dispatch(Constants.SAVE_COMPONENT_SPEC_SUCCESS, {
    item: item,
    type: type,
    update: update,
    publish: publish
  });
  if(successCb) {
     successCb();
  }
}

/**
 * Deletes a number of components (by id) by means of tail recursion. It
 * performs a usage check for components (not profiles) iff a componentInUsageCb
 * is provided
 * @param  {string} type      [description]
 * @param  {Array} ids       [description]
 * @param  {function} success   success callback
 * @param  {function} failure   failure callback
 * @param  {function} componentInUsageCb component in use callback
 * @param  {Array} [remainder] [description]
 */
function deleteComponents(type, ids, success, failure, componentInUsageCb, remainder) {
  if(remainder == undefined) {
    remainder = ids.slice();
  }
  if(remainder.length == 0) {
    // done
    log.trace("Nothing left to delete");
    success(ids);
  } else {
    // some items left to delete... take first
    var id = remainder.shift();
    log.trace("Requesting deletion of", id);

    // callback that wraps success callback, passing it with remainder to
    // this function
    var handleSuccess = function() {
      //deleted
      log.trace("Successfully deleted", id);
      //process remainder
      deleteComponents(type, ids, success, failure, componentInUsageCb, remainder);
    };

    var handleFailure = function(msg) {
      remainder.push(id);
      var removed = $(ids).not(remainder).get();
      log.debug("Abort deletion",ids, remainder, "- Removed:", removed);
      if(removed.length != 0) {
        success(removed);
      }
      failure({
        message: msg,
        ids: remainder
      });
    };

    tryDeleteComponent(type, id, componentInUsageCb,
      ComponentRegistryClient.deleteComponent.bind(null, type, id, handleSuccess, handleFailure),
      handleFailure.bind(null, null));
  }
}

/**
 * Tries to delete a component, aborts if component is in use
 * @param  {[type]} type               [description]
 * @param  {[type]} id                 [description]
 * @param  {[type]} componentInUsageCb [description]
 * @param  {[type]} doDelete           [description]
 * @param  {[type]} doAbort            [description]
 * @return {[type]}                    [description]
 */
function tryDeleteComponent(type, id, componentInUsageCb, doDelete, doAbort) {
  // Almost ready to try saving...
  if(componentInUsageCb == null // No callback means no usage check
    || type == Constants.TYPE_PROFILE) { // Profile, no usage check required so save
    doDelete();
  } else {
      // Component, may be in use so check
      ComponentRegistryClient.usageCheck(id, function(result) {
        // result is null if not in use, otherwise has a list of profile and component descriptions
        if(result == null) {
          log.debug("Component not in use, can be deleted...");
          doDelete();
        } else {
          log.debug("Component requested for deletion", id, "is in use:", result);

          var resultObj = [];
          if(result.profileDescription)
            resultObj.push({ componentId: id, result: result.profileDescription });
          if(result.componentDescription)
            resultObj.push({ componentId: id, result: result.componentDescription });
          componentInUsageCb(resultObj, doDelete, doAbort);
        }
      });
  }
}

/**
 * Moves a number of components (by id) by means of tail recursion.
 * @param  {Array} ids       [description]
 * @param  {number} teamId       [description]
 * @param  {function} success   success callback
 * @param  {function} failure   failure callback
 * @param  {Array} [remainder] [description]
 */
function moveComponentsToTeam(ids, teamId, success, failure, remainder) {
  if(remainder == undefined) {
    remainder = ids.slice();
  }
  if(remainder.length == 0) {
    // done
    log.trace("Nothing left to move");
    success(ids);
  } else {
    // some items left to move... take first
    var id = remainder.shift();
    log.trace("Requesting moving of", id);

    // callback that wraps success callback, passing it with remainder to
    // this function
    var handleSuccess = function() {
      //moved
      log.trace("Successfully moved", id);
      //process remainder
      moveComponentsToTeam(ids, teamId, success, failure, remainder);
    };

    ComponentRegistryClient.transferComponent(id, teamId,
      handleSuccess, //success
      function(msg) { //failure
        remainder.push(id);
        if(failure) {
          failure({
            message: msg,
            ids: remainder
          });
        }
      });
  }
}

function updateSpecStatus(spec, status) {
  // get updated version of spec with requested target status
  var statusHeaderValue;
  if(status == Constants.STATUS_DEVELOPMENT) {
    statusHeaderValue = "development";
  } else if(status == Constants.STATUS_PRODUCTION) {
    statusHeaderValue = "production";
  } else {
    log.error("Invalid status upon publication: ", status);
    return null;
  }
  return update(spec, {
    Header: {
      Status: {
        $set: statusHeaderValue
      }
    }
  });
}

function checkUpdateRights (dispatch, item, authState, onAllowed, onDisallowed) {
  log.debug("Checking wether user is allowed to change status of item", item);
  dispatch(Constants.SET_STATUS_PERMISSION_CHECK, item);

  var handleAllowed = function() {
    dispatch(Constants.SET_STATUS_PERMISSION_CHECK_DONE, item);
    onAllowed();
  }

  var handleDisallowed = function() {
    dispatch(Constants.SET_STATUS_PERMISSION_CHECK_DONE, item);
    onDisallowed();
  }

  if(authState.userId === item.userId || authState.isAdmin) {
    //current user is owner
    handleAllowed();
  } else {
    log.debug("User (", authState.userId, ") is not owner (", item.userId, "), checking whether teams overlap");
    //check if item is in any teams
    ComponentRegistryClient.loadItemGroups(item.id, function(itemTeams) {
      //make array if singleton
      itemTeams = ensureArray(itemTeams);
      if(itemTeams.length > 0) {
        log.debug("Item is in teams", itemTeams);
        //TODO: check if user is member of any of those teams -> /rest/groups/usermembership
        ComponentRegistryClient.loadTeams(function(userTeams){
          log.debug("User is in teams", userTeams);
          //make array if singleton
          userTeams = ensureArray(userTeams);
          if(userTeams != null && _.intersection(_.map(itemTeams,'id'), _.map(userTeams,'id')).length > 0) {
            log.debug("Team ids overlap, user can update status");
            handleAllowed();
          } else {
            log.debug("No overlap between item teams and user teams");
            handleDisallowed();
          }
        }, handleDisallowed);
      } else {
        //no groups or no overlap with user groups
        handleDisallowed();
      }
    }, handleDisallowed);
  }
}
