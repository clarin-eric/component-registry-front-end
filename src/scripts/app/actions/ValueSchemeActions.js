var log = require('loglevel');
var update = require('react-addons-update');
var _ = require('lodash');

var Constants = require("../constants");

var ComponentRegistryClient = require('../service/ComponentRegistryClient');
var Validation = require('../service/Validation');

var ValueSchemeActions = {

  loadAllowedTypes: function() {
    var success = function(data) {
      this.dispatch(Constants.LOAD_ALLOWED_TYPES_SUCCESS, data.elementType);
    }.bind(this);

    var failure = function(msg) {
      this.dispatch(Constants.LOAD_ALLOWED_TYPES_FAILURE, msg);
    }.bind(this);

    ComponentRegistryClient.loadAllowedTypes(success, failure);
  },

  loadValueScheme: function(element) {
    log.trace("Loading value scheme for element", element);

    var vocabulary = null;
    var type = null;
    var pattern = null;

    if(element.ValueScheme) {
      if(element.ValueScheme.Vocabulary) {
        vocabulary = deepCopy(element.ValueScheme.Vocabulary);
      } else if(element.ValueScheme.pattern) {
        pattern = element.ValueScheme.pattern.valueOf();
      }
    } else if(element['@ValueScheme']) {
      type = element['@ValueScheme'].valueOf();
    }

    if(!(vocabulary || type || pattern)) {
      log.error("No value scheme in element", element);
    }

    this.dispatch(Constants.LOAD_VALUE_SCHEME, {
      vocabulary: vocabulary,
      type: type,
      pattern: pattern
    });

    //set initial tab after data load
    var tab;
    if (vocabulary != null) tab = Constants.VALUE_SCHEME_TAB_VOCAB;
    else if (pattern != null) tab = Constants.VALUE_SCHEME_TAB_PATTERN;
    else tab = Constants.VALUE_SCHEME_TAB_TYPE;
    this.dispatch(Constants.SET_VALUE_SCHEME_TAB, tab);
  },

  setValueSchemeTab: function(tab) {
    this.dispatch(Constants.SET_VALUE_SCHEME_TAB, tab);
  },

  updateType: function(value) {
    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      type: value,
    });
  },

  updatePattern: function(value) {
    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      pattern: value,
    });
  },

  updateVocabularyItem: function(oldVocabulary, itemIndex, property, newValue) {
    log.debug("Update item",itemIndex, "of vocabulary", oldVocabulary);
    var newItem = _.cloneDeep(oldVocabulary.enumeration.item[itemIndex]);
    newItem[property] = newValue;

    var updatedVocab = update(oldVocabulary,
      {enumeration:
        {item:
          {$splice: [[itemIndex, 1, newItem]]}
        }
      });

    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      vocabulary: updatedVocab
    });
  },

  setVocabularyItems: function(oldVocabulary, newItems) {
    var updatedVocab = update(oldVocabulary,
      {enumeration:
        {item:
          {$set: newItems}
        }
      });

    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      vocabulary: updatedVocab
    });
  },

  addVocabularyItem: function(oldVocabulary) {
    log.debug("Add new item to vocabulary", oldVocabulary);

    var vocab;
    if(oldVocabulary == null) {
      vocab = {};
    } else {
      vocab = oldVocabulary;
    }

    if(!vocab.enumeration || !vocab.enumeration.item) {
      vocab = update(vocab, {enumeration: {$set:
          {item: []}
      }});
    }

    var updatedVocab = update(vocab,
      {enumeration:
        {item:
          {$push:
            [
              {'$': ""}
            ]
          }
        }
      });

    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      vocabulary: updatedVocab
    });
  },

  removeVocabularyItem: function(oldVocabulary, itemIndex) {
    var updatedVocab = update(oldVocabulary,
      {enumeration:
        {item:
          {$splice: [[itemIndex, 1]]}
        }
      });
    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      vocabulary: updatedVocab
    });
  },

  resetValueSchemeValidationError: function() {
    this.dispatch(Constants.SET_VALUE_SCHEME_VALIDATION_ERROR, null);
  },

  setVocabularyUri: function(oldVocabulary, uri, valueProperty, valueLanguage) {
    var newUri;
    if(uri == null || uri.trim() === '') {
      newUri = null;
    } else {
      newUri = uri;
    }

    var newValueProperty;
    if(valueProperty == null || valueProperty.trim() === '') {
      newValueProperty = null;
    } else {
      newValueProperty = valueProperty;
    }

    var newValueLanguage;
    if(valueLanguage == null || valueLanguage.trim() === '') {
      newValueLanguage = null;
    } else {
      newValueLanguage = valueLanguage;
    }

    var newValues = {
      '@URI': newUri,
      '@ValueProperty': newValueProperty,
      '@ValueLanguage': newValueLanguage
    };

    var updatedVocab;
    if(oldVocabulary == null) {
      updatedVocab = newValues;
    } else {
      updatedVocab = update(oldVocabulary, {$merge: newValues});
    }
    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      vocabulary: updatedVocab
    });
  },

  setVocabularyTypeOpen: function(oldVocabulary) {
    if(oldVocabulary == null) {
      var updatedVocab = {};
    } else {
      var updatedVocab = update(oldVocabulary, {
        enumeration: {$set: null}
      });
    }

    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      vocabulary: updatedVocab
    });
  },

  setVocabularyTypeClosed: function(oldVocabulary) {
    if(oldVocabulary == null) {
      var updatedVocab = {
        enumeration: {
          item: []
        }
      };
    } else {
      //switch to an closed vocabulary
      var updatedVocab = update(oldVocabulary, {
        $merge: {
          //unset extrnal vocabulary link
          '@URI': null,
          '@ValueProperty': null,
          '@ValueLanguage': null,
          //instantiate an empty enumeration
          enumeration: {
            item: []
          }
        }
      });
    }
    this.dispatch(Constants.UPDATE_VALUE_SCHEME, {
      vocabulary: updatedVocab
    });
  },

  validateValueScheme: function(valueScheme) {
    log.trace("Validating value scheme", valueScheme);

    //function to propagate feedback message from validator to store(s)
    var setValidationError = function(msg){
      this.dispatch(Constants.SET_VALUE_SCHEME_VALIDATION_ERROR, msg);
    }.bind(this);

    //in case no value scheme is set at all
    if(!valueScheme) {
      setValidationError("Validation failed");
      return false;
    }

    //there should be a type, pattern or vocabulary in the change request
    if(valueScheme.hasOwnProperty('type')) {
      log.debug("Validating type", valueScheme.type);
      return Validation.validateSimpleTypeValueScheme(valueScheme.type, setValidationError);
    } else if(valueScheme.hasOwnProperty('pattern')) {
      log.debug("Validating pattern", valueScheme.pattern);
      return Validation.validatePatternValueScheme(valueScheme.pattern, setValidationError);
    } else if(valueScheme.hasOwnProperty('vocabulary')) {
      log.debug("Validating vocabulary", valueScheme.vocabulary);
      return Validation.validateVocabularyValueScheme(valueScheme.vocabulary, setValidationError);
    } else {
      //no value scheme at all!
      setValidationError("A value must be provided");
      return false;
    }
  }
};

module.exports = ValueSchemeActions;

function deepCopy(obj) {
  if(obj != null) {
    return JSON.parse(JSON.stringify(obj));
  }
}
