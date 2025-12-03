'use strict';
var log = require('loglevel');
var Constants = require("../constants");
var _ = require('lodash');

var ConceptEvaluator = {
  isDiscouraged: function(link, context) {
    //TODO: isocat
    // var isocatPattern = /^http(s?):\/\/www\.isocat\.org/;

    if(link === '') {
      return false;
    }

    log.debug("Evaluating concept link:", link, "Context:", context);

    if(true)
    return discourage("Usage of this concept link is discouraged for an unspecificed reason");

    return {
      "discouraged": false
    };
    }
}

function discourage(reason) {
  return {
    "discouraged": true,
    "reason": reason
  }
}

module.exports = ConceptEvaluator;
