'use strict';
var log = require('loglevel');
var Constants = require("../constants");
var _ = require('lodash');

module.exports = {
  evaluator: function (rules) {
    return {
      evaluateConceptLink: function (link, parentType) {
        if (link != '' && rules != null && rules['ruleSets'] != null) {
          return evaluate(link, parentType, rules['ruleSets']);
        } else {
          //no link to evaluate, or no rules to check against
          return {
            "discouraged": false
          };
        }
      }
    }
  }
};

function evaluate(link, type, ruleSets) {
  var discouragement = findDiscouragement(link, ruleSets, type);

  log.trace("Matching rule with discouragement:", discouragement);

  if (discouragement) {
    log.info('Concept link discouraged:', link, "Rule:", discouragement);
    if (discouragement['reason']) {
      return discourage(discouragement['reason']);
    } else {
      log.warn('Matched rule has no reason:', discouragement);
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

function findDiscouragement(link, ruleSets, type) {
  log.trace("Evaluating concept rules for link", link);
  // looking for a matching rule with discouragement
  var discouragement = _(ruleSets)
    //consider only rulesets that match the type context (e.g. element) or those with a wildcard
    .filter(function (rule) {
      return _.includes(rule.types, '*') || _.includes(rule.types, type);
    })
    //combine rules from all matching rule sets
    .map('rules').flatten()
    //find any rule with a matching regex
    .filter(
      rule => _(rule)
        //consider only the regex for discouragement
        .get('discouraged.regex')
        //does the link match at least one regex?
        .some(
          regex => new RegExp(regex).test(link)))
    //use first matching rule
    .head();
  return discouragement;
}

function discourage(reason) {
  return {
    "discouraged": true,
    "reason": reason
  }
}