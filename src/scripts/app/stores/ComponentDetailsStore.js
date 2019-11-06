var Fluxxor = require("fluxxor"),
    Constants = require("../constants"),
    ExpansionState = require("../service/ExpansionState"),
    React = require('react');

var log = require('loglevel');

var update = require('react-addons-update');
var changeObj = require('../util/ImmutabilityUtil').changeObj;

var ComponentSpecStore = Fluxxor.createStore({
  initialize: function(options) {
    this.loading = false;
    this.spec = null;
    this.xml = null;
    this.comments = [];
    this.activeView = Constants.INFO_VIEW_SPEC;
    this.expansionState = {};
    this.linkedComponents = {};
    this.newComment = null;

    this.bindActions(
      Constants.LOAD_COMPONENT_SPEC, this.handleLoadSpec,
      Constants.LOAD_COMPONENT_SPEC_SUCCES, this.handleLoadSpecSuccess,
      Constants.LOAD_COMPONENT_SPEC_XML_SUCCES, this.handleLoadSpecXmlSuccess,
      Constants.LOAD_COMPONENT_SPEC_FAILURE, this.handleLoadSpecFailure,

      Constants.TOGGLE_ITEM_EXPANSION, this.handleToggleItemExpansion,
      Constants.SET_ITEM_EXPANSION, this.handleSetItemExpansion,
      Constants.LINKED_COMPONENTS_LOADED, this.handleLinkedComponentsLoaded,
      Constants.COMPONENT_SPEC_UPDATED, this.handleSpecUpdate,

      Constants.LOAD_COMMENTS, this.handleLoadComments,
      Constants.LOAD_COMMENTS_SUCCESS, this.handleLoadCommentsSuccess,
      Constants.LOAD_COMMENTS_FAILURE, this.handleLoadCommentsFailure,

      Constants.SAVE_COMMENT, this.handleSaveComment,
      Constants.SAVE_COMMENT_SUCCESS, this.handleSaveCommentSuccess,
      Constants.SAVE_COMMENT_FAILURE, this.handleSaveCommentFailure,

      Constants.DELETE_COMMENT_SUCCESS, this.handleDeleteCommentSuccess
    );
  },

  getState: function() {
    return {
      loading: this.loading,
      activeView: this.activeView,
      spec: this.spec,
      xml: this.xml,
      comments: this.comments,
      newComment: this.newComment,
      expansionState: this.expansionState, // object that has a boolean value for each component 'appId' to indicate expansion
      linkedComponents : this.linkedComponents
    };
  },

  handleLoadSpec: function() {
    // loading a spec (XML or JSON)
    this.loading = true;
    this.emit("change");
  },

  handleLoadSpecSuccess: function(result) {
    var spec = result.spec;
    var linkedComponents = result.linkedComponents;

    // JSON spec loaded
    this.loading = false;
    this.spec = spec;

    // reset view state
    this.activeView = Constants.INFO_VIEW_SPEC;
    // reset expansion state
    this.expansionState = changeObj(spec.Component._appId, true);
    // reset linked components state
    if(linkedComponents == undefined) {
      this.linkedComponents = {};
    } else {
      this.linkedComponents = linkedComponents;
    }

    this.emit("change");
  },

  handleSpecUpdate: function(spec) {
    this.spec = spec;
    this.emit("change");
  },

  handleLoadSpecXmlSuccess: function(xml) {
    // XML spec loaded
    this.loading = false;
    this.xml = xml;
    this.activeView = Constants.INFO_VIEW_XML;
    this.emit("change");
  },

  handleLoadSpecFailure: function() {
    // loading failed (XML or JSON)
    this.loading = false;
    this.emit("change");
  },

  handleToggleItemExpansion: function(obj) {
    var itemId = obj.itemId;
    var defaultState = obj.defaultState;
    // toggle boolean value in expansion state object (default when undefined is false)
    var currentState = ExpansionState.isExpanded(this.expansionState, itemId, defaultState);
    log.trace("Toggling", itemId, "currently", currentState);
    this.expansionState = ExpansionState.setChildState(this.expansionState, itemId, !currentState);
    log.trace("New expansion state: ", this.expansionState);
    this.emit("change");
  },

  handleSetItemExpansion: function(obj) {
    var itemIds = obj.itemIds;
    for(var i=0;i<(itemIds.length);i++) {
      this.expansionState = ExpansionState.setChildState(this.expansionState, itemIds[i], obj.expansionState);
    }
    this.emit("change");
  },

  handleLinkedComponentsLoaded: function(linkedComponents) {
    // additional linked components have been loaded - merge with current set
    this.linkedComponents = update(this.linkedComponents, {$merge: linkedComponents});
    this.emit("change");
  },

  handleLoadComments: function() {
    this.loading = true;
    this.comments = [];
    this.emit("change");
  },

  handleLoadCommentsSuccess: function(comments) {
    this.loading = false;

    if($.isArray(comments)) {
      this.comments = comments;
    } else {
      this.comments = [comments];
    }

    this.activeView = Constants.INFO_VIEW_COMMENTS;
    this.emit("change");
  },

  handleLoadCommentsFailure: function() {
    this.loading = false;
  },

  handleSaveComment: function(comments) {
    log.debug("Saving comment", comments);

    //store form value (in case save action fails)
    this.newComment = comments;

    //push temporary comment (optimistic update)
    var comment = {
      canDelete: false,
      userName: "Posting...",
      commentDate: null,
      comments: comments
    };
    if($.isArray(this.comments)) {
      this.comments = update(this.comments, {$push: [comment]});
    } else {
      this.comments = [comments];
    }
    this.emit("change");
  },

  handleSaveCommentSuccess: function(comment) {
    log.debug("Saved comment", comment);

    //form value can be removed, form should be blank
    this.newComment = "";

    //replace temporary comment with actual result
    comment = update(comment, {$merge: {canDelete: "true"}});
    this.comments = update(this.comments, {$splice: [[this.comments.length-1, 1, comment]]});
    this.emit("change");
  },

  handleSaveCommentFailure: function() {
    //remove temporary comment
    this.comments = update(this.comments, {$splice: [[this.comments.length-1, 1]]});
    this.emit("change");
  },

  handleDeleteCommentSuccess: function(id) {
    // look up the comment in the current comments list
    var index = -1;
    if($.isArray(this.comments)) {
      for(i=0;i<this.comments.length;i++) {
        if(this.comments[i].id == id) {
          index = i;
        }
      }
    }

    // and remove it (if found)
    if(index >=0) {
      this.comments = update(this.comments, {$splice: [[index, 1]]});
    } else {
      log.warn("Did not find comment with id", id, "to remove, display state may be inaccurate");
    }
    this.emit("change");
  }

});

module.exports = ComponentSpecStore;
