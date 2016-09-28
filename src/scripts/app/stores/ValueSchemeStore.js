'use strict';
var log = require('loglevel');

var Fluxxor = require("fluxxor"),
    Constants = require("../constants");

var ValueSchemeStore = Fluxxor.createStore({
  initialize: function(options) {
    this.vocabulary = null;
    this.type = null;
    this.pattern =  null;

    this.bindActions(
      Constants.LOAD_VALUE_SCHEME, this.handleLoadValueScheme
    );
  },

  getState: function() {
    return {
      vocabulary: this.vocabulary,
      type: this.type,
      pattern: this.pattern
    };
  },

  handleLoadValueScheme: function(scheme) {
    //TODO
    this.emit("change");
  }
});

module.exports = ValueSchemeStore;