var log = require("loglevel");

var Fluxxor = require("fluxxor"),
    Constants = require("../constants"),
    React = require('react');

var _ = require('lodash');

var update = require('react-addons-update');
var changeObj = require('../util/ImmutabilityUtil').changeObj;

var MessageStore = Fluxxor.createStore({
  initialize: function(options) {
    this.messages = {
      //msg1: {type: 'message', message: 'this is a test message'},
      //err1: {type: 'error', message: 'this is a test error'}
    };

    this.bindActions(
      Constants.DISMISS_MESSAGE, this.handleDismiss,
      Constants.LOAD_ITEMS_FAILURE, this.handleError,
      Constants.LOAD_ITEM_FAILURE, this.handleError,
      Constants.LOAD_COMMENTS_FAILURE, this.handleError,
      Constants.LOAD_COMPONENT_SPEC_FAILURE, this.handleError,
      Constants.DELETE_COMPONENTS_FAILURE, this.handleError,
      Constants.MOVE_TO_TEAM_FAILURE, this.handleError,
      Constants.SAVE_COMPONENT_SPEC_FAILURE, this.handleError,
      Constants.LOAD_EDITOR_ITEMS_FAILURE, this.handleError,
      Constants.SAVE_COMMENT_FAILURE, this.handleError,
      Constants.DELETE_COMMENT_FAILURE, this.handleError,
      Constants.SAVE_COMMENT_FAILURE, this.handleError,
      Constants.SELECT_BROWSER_ITEM_FAILED, this.handleError,
      Constants.SET_STATUS_FAILTURE, this.handleError,
      Constants.SET_SUCCESSOR_FAILTURE, this.handleError,
      Constants.LOAD_ALLOWED_TYPES_FAILURE, this.handleError,
      Constants.JUMP_TO_ITEM_FAILURE, this.handleError
    );
  },

  getState: function() {
    return {
      messages: this.messages
    };
  },

  handleError: function(message) {
    if(message === undefined || message === null || _.trim(message) === "") {
      message = "Unspecified error";
    }
    // update messages object
    this.messages = addMessage(this.messages, 'error', message);
    this.emit("change");
  },

  handleDismiss: function(msgId) {
    if(this.messages.hasOwnProperty(msgId)) {
      //copy all messages to new object except one with msgId
      //TODO: nicer way of removing one property in immutable way?
      var newMessages = {};
      var currentIds = Object.keys(this.messages);
      for(var i=0;i<(currentIds.length);i++) {
        var id = currentIds[i];
        if(msgId !== id) {
          newMessages[id] = this.messages[id];
        }
      }
      this.messages = newMessages;

      log.trace("Messages after removal of", msgId, this.messages);
      this.emit("change");
    }
  }

});

module.exports = MessageStore;


/**
 * adds a new message to a messages structure
 * @param  {[type]} messages object to add to
 * @param  {[type]} type     type of message
 * @param  {[type]} obj      message object
 * @return {[type]}          new object with added message
 */
function addMessage(messages, type, obj) {
  // extract message from object
  var message;
  if(typeof obj == 'object') {
    if(obj.hasOwnProperty('message')) {
      message = obj.message;
    } else {
      message = JSON.stringify(obj);
    }
  } else  { //if(typeof obj == 'string')
    message = obj;
  }

  if(message == null) {
    return messages;
  } else {
    // assign unique id
    var id = null;
    var count=0;
    while(id == null || messages.hasOwnProperty(id)) {
      id = type + count++;
    }

    var newMsg = {
      type: type,
      message: message
    }

    return update(messages, changeObj(id, {$set: newMsg}));
  }
}
