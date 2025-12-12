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
            "warning": false
          };
        }
      }
    }
  }
};

function evaluate(link, type, ruleSets) {
  var warning = findWarning(link, ruleSets, type);

  log.trace("Matching rule with warning:", warning);

  if (warning) {
    log.info('Warning for concept link:', link, "Rule:", warning);
    if (warning['reason']) {
      return warn(warning['reason']);
    } else {
      log.warn('Matched rule has no reason:', warning);
      return warn('Discouraged according to rules');
    }
  } else {
    log.debug('No matching rules for link', link);
    //no rules found that apply, we won't warn
    return {
      "warning": false
    };
  }
}

function findWarning(link, ruleSets, type) {
  log.trace("Evaluating concept rules for link", link);
  // looking for a matching rule with warning
  var warning = _(ruleSets)
    //consider only rulesets that match the type context (e.g. element) or those with a wildcard
    .filter(function (rule) {
      return _.includes(rule.types, '*') || _.includes(rule.types, type);
    })
    //combine rules from all matching rule sets
    .map('rules').flatten()
    //find any rule with a matching regex
    .filter(
      rule => _(rule)
        //consider only the regex for warning
        .get('warning.regex', [])
        //does the link match at least one regex?
        .some(
          regex => new RegExp(regex, getFlags(rule)).test(link)))
    //use first matching rule
    .head();
  return warning;
}

function getFlags(rule) {
  if(rule['caseSensitive']) {
    return '';
  } else {
    return 'i';
  }
}

function warn(reason) {
  return {
    "warning": true,
    "reason": reason
  }
}