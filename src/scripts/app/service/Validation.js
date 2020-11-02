var log = require('loglevel');
var _ = require('lodash');
var ncname = require('ncname');

var err = {
  IllegalAttributeName: 'Illegal name value for attribute',
  IllegalConceptLink: 'Illegal value for ConceptLink',
  IllegalValueScheme: 'Illegal or missing value for type',
  ReqName:  'Component or element is missing a name',
  ReqComponentDesc: 'Component description is required',
  ReqDisplayPriority: 'Display priority value is required for elements',
  ReqValueScheme: 'Valid type value is required'
};

var requiredString = {
  test: function(v) {return v != null && v.length > 0},
  message: "Field cannot be empty"
}

var noSpaces = {
  test: function(v) {return v.indexOf(" ") < 0},
  message: "Field cannot contain spaces"
}

var ncName = {
  test: function(v) {return ncname.test(v)},
  message: "Not a valid name"
}

var regex = function(expr, msg) {
  return {
    test: function(v) {return v == null || v.length == 0 || expr.test(v)},
    message: msg
  };
}

var minValue = function(lowBound) {
  return {
    test: function(v) { log.debug('test min val', v, lowBound); return v>= lowBound; },
    message: "Minimal value: " + lowBound
  }
}

var uriPattern = /^([^:\/?#]+):(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;
var conceptLinkUri = regex(uriPattern, "Must be a valid URI")

var validators = {
  header: {
    'Name': [requiredString, noSpaces, ncName],
    'Description': [requiredString],
    'Component.@ConceptLink': [conceptLinkUri]
  },
  component: {
    '@name': [requiredString, noSpaces, ncName],
    '@ConceptLink': [conceptLinkUri]
  },
  element: {
    '@name': [requiredString, noSpaces, ncName],
    '@ConceptLink': [conceptLinkUri],
    '@cue:DisplayPriority': [minValue(0)],
    'AutoValue': [requiredString]
  },
  attribute: {
    '@name': [requiredString, noSpaces, ncName],
    '@ConceptLink': [conceptLinkUri],
    'AutoValue': [requiredString]
  }
};

var testConceptLink = function(fieldValue) {
  var regExp = uriPattern;
  if(typeof fieldValue === "string" && fieldValue.length > 0 && !regExp.test(fieldValue))
    return false;
  return true;
};

var testAttribute = function(attr, cb) {
  var errReturned = false;
  if(!testAttributeName(attr)) errReturned = cb(err.IllegalAttributeName + ": " + attr['@name']);
  if(!testValueScheme(attr)) errReturned = cb(err.IllegalValueScheme);
  if(!testConceptLink(attr['@ConceptLink'])) errReturned = cb(err.IllegalConceptLink);
  if(!testValueScheme(attr)) errReturned = cb(err.ReqValueScheme);

  if(!errReturned) log.debug('Tests Passed: Attribute (' + attr.attrId + ')');
  return !errReturned;
};

var testAttributeName = function(fieldValue) {
  var regExpName = /^[A-Za-z0-9_\-]+$/;
  if(fieldValue != undefined || fieldValue != null)
    if(!fieldValue.hasOwnProperty('@name')) return false;
    else if(fieldValue['@name'].length <= 0 || !regExpName.test(fieldValue['@name'])) return false;
  return true;
};

var testAttributeList = function(attrList, cb) {
  if(attrList != undefined)
    if(attrList.Attribute != undefined && $.isArray(attrList.Attribute))
      for(var i=0; i < attrList.Attribute.length; i++)
        return testAttribute(attrList.Attribute[i], cb)
    else return testAttribute(attrList, cb);
  return true;
};

var testValueScheme = function(item) {
  if(item['@ValueScheme'] != null) {
    if( item['@ValueScheme'].length <= 0) {
      log.warn("Empty value scheme set on item", item);
      return false;
    }
    return true;
  } else if(item.ValueScheme == null) {
    log.warn("No value scheme specified for item", item);
    return false;
  } else {
    var fieldValue = item['ValueScheme'];
    var vocabulary = fieldValue.Vocabulary;
    var pattern = fieldValue.pattern;
    if((vocabulary != null &&
          (vocabulary.enumeration != null && vocabulary.enumeration.item != null
            || vocabulary['@URI'] != null && vocabulary['@ValueProperty'] != null))
          || (pattern != null && pattern.length > 0)) {
        return true;
      }
    else {
      return false;
    }
  }
};

var testMandatoryElementFields = function(componentDesc, cb) {
  if(!testValueScheme(componentDesc)) {
    cb(err.ReqValueScheme);
  }
};

var testMandatoryFields = function(header, componentDesc, cb) {
  var regExpName = /^[A-Za-z0-9_\-]+$/;
  var errReturned = false;
  if(header != null) {
    if(header.Name != undefined && header.Name.length <= 0) errReturned = cb(err.ReqName);
    if(header.Description != undefined && header.Description.length <= 0) errReturned = cb(err.ReqComponentDesc);
  }
  if(componentDesc != null) {
    if(componentDesc['@name'] != null && (componentDesc['@name'].length <= 0 || !regExpName.test(componentDesc['name']))) errReturned = cb(err.ReqName);
  }
  return !errReturned;
};

var testCardinalitySettings = function(minValue, maxValue) {
  // TODO required?
  return true;
};

var isEmptyDocumentationValue = function(doc) {
  var docVal = doc['$'];
  return docVal == null || (typeof docVal === 'string') && docVal.trim() === '';
};

/**
* Validation - client-side validation checks before saving a CMDI Profile or Component item.
*/
var Validation = {

  validateField: function(parent, field, val, feedback) {
    var tests = validators[parent][field];
    if($.isArray(tests)) {
      for(i=0;i<tests.length;i++) {
        var test = tests[i];
        log.trace("Testing", test);
        if(!test.test(val)) {
          // a test failed
          log.debug("Failed validation test for field", field, "=", val, ":", test.message);
          if(feedback != null) {
            feedback(test.message);
          }
          return false;
        }
      }
    } else {
      log.warn("No validators for field", parent, field, "in", validators);
    }
    // no test failed
    return true;
  },

  checkUniqueSiblingName: function(items, field, name, feedback) {
    if(items != null) {
      var count = 0;
      for(var i=0;i<(items.length);i++) {
        if(items[i][field] === name) {
          count++;
        }
        if(count > 1) {
          feedback("Sibling names must be unique");
          return false;
        }
      }
    }
    return true;
  },

  validateSimpleTypeValueScheme: function(type, feedback) {
    //check if we have anything to work with...
    if(type == null || (typeof type !== 'string') || type.trim() === "") {
      feedback("Type cannot be empty");
      return false;
    }
    return true;
  },

  validatePatternValueScheme: function(pattern, feedback) {
    //check if we have anything to work with...
    if(pattern == null || (typeof pattern !== 'string') || pattern.trim() === "") {
      feedback("Pattern cannot be empty");
      return false;
    }

    //check whether pattern is a valid regex by trying to parse it
    try {
      new RegExp(pattern);
    } catch(exception) {
      //an exception is thrown if the regexp objet cannot be created, usually because of an error in the definition
      log.warn("Cannot parse regular expression", exception);
      feedback("Not a valid regular expression! " + exception);
      return false;
    }
    return true;
  },

  validateDocumentation: function(documentation, feedback) {
    if($.isArray(documentation)) {
      // Only one documenation element can be empty
      // -> get from array where $.trim()==='', length should be <= 1
      if(_.chain(documentation).filter(isEmptyDocumentationValue).size().value() > 1) {
        feedback("Multiple empty documentation elements are not allowed.");
        return false;
      }
      // Only one documentation entry per language code, and not more than one without language specified.
      // and only one documenation element can be not set
      // -> get count for appearing @lang values, all should be equal to 1 (also covers empty cases (as 'undefined'))
      if(!_.chain(documentation).countBy('@lang').values().every(function(v){return v==1}).value()) {
        feedback("Documentation languages must be unique and at most one documentation element can have no language specified.");
        return false;
      }
    }
    return true;
  },

  validateVocabularyValueScheme: function(vocab, feedback) {
    //check if we have anything to work with...
    if(vocab == null) {
      feedback("Vocabulary is undefined");
      return false;
    }

    var hasUri = vocab['@URI'] != null && vocab['@URI'].trim() != '';

    if(vocab.enumeration != null) {
      //require enumeration with one or more items if no URI is set
      if(!$.isArray(vocab.enumeration.item)) {
        feedback("Vocabulary must have one or more items");
        return false;
      }

      //validate items in vocabulary
      if(!this.checkVocabularyItems(vocab.enumeration.item, feedback)) {
        return false;
      }
    } else {
      //no enumaration => open vocabulary => URI required
      if(!hasUri) {
        feedback("An open vocabulary requires a URI to be set");
        return false;
      }
    }

    if(hasUri) {
        var uriLower = vocab['@URI'].toLowerCase();
        if(!uriLower.startsWith('http://') && !uriLower.startsWith('https://') || !uriPattern.test(vocab['@URI'])) {
          feedback('Vocabulary URI must be a valid URI with \'http\' or \'https\' as scheme!');
          return false;
        }
        if(!vocab['@ValueProperty'] || vocab['@ValueProperty'].trim() == '') {
          feedback('A value property has to be set if an external vocabulary URI is defined. Please check the details!');
          return false;
        }
    } else {
      if(vocab['@ValueProperty'] && vocab['@ValueProperty'].trim() != '') {
        feedback('A value property must not be defined unless an external vocabulary URI is defined. Please check the details!');
        return false;
      }
    }

    return true;
  },

  checkVocabularyItems: function(items, feedback) {
    var itemValuesChain = _.chain(items).map(function(item) {
      return item['$'];
    });

    //empty check (lazy)
    var hasEmpty = itemValuesChain.some(function(val){
      return val == "";
    });

    //check for duplicates (lazy)
    var duplicates = itemValuesChain
      .countBy() // get counts for all item values
      .pick(function(value) { return value > 1; }) // filter out non-duplicates
      .keys(); // only keep keys

    if(hasEmpty.value()) {
      log.warn("Empty item(s)");
      feedback("A vocabulary cannot items with an empty value. Please remove these items and try again.");
      return false;
    } else if(!duplicates.isEmpty().value()) {
        // construct an array of duplicate values
        log.warn("Duplicate in array:", duplicates.value());
        feedback("All items in a vocabulary should have a unique value. Please remove these duplicate values and try again:\n\n" + duplicates.value());
        return false;
    } else {
      return true;
    }
  },

  validate: function(data) {
    log.debug('validate data');

    var errors = [];
    var addError = function(message) {
      errors.push({ message: message });
      return false;
    };

    var header = (data.Header != undefined) ? data.Header : null;
    var componentDesc = (data.Header != undefined) ? data.Component : data;

    if(testMandatoryFields(header, componentDesc, addError))
      log.debug('Test Passed: Mandatory fields');

    if(!testConceptLink(componentDesc['@ConceptLink']))
      addError(err.IllegalConceptLink);
    else
      log.debug('Test Passed: Concept Registry field');

    /*if(!testCardinalitySettings(componentDesc['@CardinalityMin'], componentDesc['@CardinalityMax']))
      addError(err.CardinalitySettings);
    else
      log.debug('Test Passed: Cardinality Settings (root)');
    */

    // attributes
    testAttributeList(componentDesc.AttributeList, addError);

    // elements
    var elems = componentDesc.Element;
    if(elems != undefined || elems != null) {
      for(var i=0; i < elems.length; i++) {
        if(elems[i].AttributeList != undefined) testAttributeList(elems[i].AttributeList, addError);
        testMandatoryFields(null, elems[i], addError);
        testMandatoryElementFields(elems[i], addError);
      }
    }

    // components
    var comps = componentDesc.Component;
    if(comps != undefined && comps != null) {
      for(var i=0; i < comps.length; i++) {
        if(!comps[i].hasOwnProperty('@ComponentRef')) {
          testMandatoryFields(null, comps[i], addError); //inline-component
          if(!testConceptLink(comps[i]['@ConceptLink'])) addError(err.IllegalConceptLink);
          if(comps[i].AttributeList != undefined) testAttributeList(comps[i].AttributeList, addError)
        }
      }
    }

    return (errors.length > 0) ?
      { errors: errors } :
      data;
  }
};

module.exports = Validation;
