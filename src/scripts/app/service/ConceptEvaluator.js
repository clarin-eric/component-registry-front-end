'use strict';
var log = require('loglevel');
var Constants = require("../constants");
var _ = require('lodash');

function discourage(reason) {
  return {
    "discouraged": true,
    "reason": reason
  }
}

function evaluateRule(link, rule, index, collection) {
  log.debug('Evaluating rule:', rule, 'for link:', link);
  return _.some(_.get(rule, 'discouraged.regex'), function(regex) {
    return new RegExp(regex).test(link);
  });
}


function evaluate(link, type, ruleSets) {
  var ruleSetsForType = _.filter(ruleSets, function (rule) {
    return _.includes(rule.types, type);
  });

  log.debug('Rulesets for type:', type, ruleSetsForType);
  
  var rulesForType = _.flatten(_.map(ruleSetsForType, 'rules'));
  log.debug('Rules for type:', type, rulesForType);

  var matchingRule = _.find(rulesForType, evaluateRule.bind(null, link));

  log.debug("Matching rule:", matchingRule);

  if (matchingRule) {
    log.info('Concept link discouraged:', link, "Rule:", matchingRule);
    if (matchingRule['reason']) {
      return discourage(matchingRule['reason']);
    } else {
      log.warn('Matched rule has no reason:', matchingRule);
      return discourage('Discouraged according to rules');
    }
  } else {
    log.debug('No matching rules for link', link);
    //no rules found that apply, we won't discourage
    return {
      "discouraged": false
    };
  }
}

module.exports = {

  evaluator: function (rules) {
    return {
      evaluateConceptLink: function (link, parentType) {
        if (link != '' && rules != null && rules['ruleSets'] != null) {
          return evaluate(link, parentType, rules['ruleSets']);
        }

        return {
          "discouraged": false
        };
      }
    }
  }
};
