/** @module General configuration for Component Registry REST service */


var ConfigObject = {
  Config: {},
  ccrUrl: "",
  vocabulariesUrl: "",
  vocabularyItemsUrl: "",
  restUrl: "",
  adminUrl: "",
  webappUrl: "",
  conceptRules: {},
  loadingState: $.Deferred()
}


var configUrl = './compRegConfig.jsp' + window.location.search; //pass all query params

var configRetrieval = $.ajax({
  url: configUrl,
  dataType: "json",
  success: function (result) {
    console.log("Read configuration from '" + configUrl + "': ", JSON.stringify(result));

    var getUrl = function () {
      var trailingSlashPattern = /^(.*)(\/)$/;
      if (trailingSlashPattern.test(result.REST.url)) {
        //remove the trailing slash
        return result.REST.url.replace(trailingSlashPattern, "$1");
      } else {
        return result.REST.url;
      }
    };

    ConfigObject.Config = result;
    ConfigObject.vocabulariesUrl = getUrl() + "/vocabulary/vocabularies";
    ConfigObject.vocabularyItemsUrl = getUrl() + "/vocabulary/items";
    ConfigObject.vocabularyPageUrl = getUrl() + "/vocabulary/page";
    ConfigObject.restUrl = getUrl() + "/rest";
    ConfigObject.adminUrl = getUrl() + "/admin";
    ConfigObject.webappUrl = getUrl();
    ConfigObject.conceptSearchUrl = ConfigObject.restUrl + "/concepts/search";
    ConfigObject.conceptRules = conceptRules;

    console.log("Configuration object constructed: " + JSON.stringify(ConfigObject));

    ConfigObject.loadingState.resolve();
  },
  error: function (jqxhr, status, error) {
    console.log("Configuration could not be loaded: " + error);
    ConfigObject.loadingState.rejectWith(jqxhr, { status: status, error: error });
  }
});


//TODO: read from configx`
var conceptRules = {

  //TODO: isocat
  // var isocatPattern = /^http(s?):\/\/www\.isocat\.org/;

  "ruleSets": [
    {
      "types": ['*'],
      rules: [{
        "reason": "ISOCat has been deprecated",
        "discouraged": {
          "regex": [
            "^http(s?):\/\/www\.isocat\.org"
          ],
        }
      }]
    }, {
      "types": ['*'],
      rules: [{
        "reason": "The CLARIN Concept Registry has been deprecated",
        "discouraged": {
          "regex": [
            "^http(s?):\/\/hdl\.handle\.net\/11459\/CCR"
          ]
        }
      }]
    }, {
      "types": ['element', 'attribute'],
      rules: [{
        "reason": "Wikidata properties are recommended for elements and attributes",
        "discouraged": {
          "regex": [
            '^http(s?)://.*wikidata\.org/entity/Q' //TODO: case insensitive for domain part?
          ]
        }
      }, {
        "reason": "Classes are not recommended for elements and attributes",
        "caseSensitive": true,
        "discouraged": {
          "regex": [
            '^http(s?):\/\/schema\.org\/[A-Z]' //TODO: case insensitive for domain part?
          ]
        }
      }
      ]
    }, {
      "types": ['vocabulary'],
      "rules": [{
        "reason": "Wikidata items are recommended for vocabulary items",
        "discouraged": {
          "regex": [
            '^http(s?):\/\/.*wikidata.org\/entity\/P' //TODO: case insensitive for domain part?
          ]
        }
      }]
    }, {
      "types": ['profile'],
      "rules": [{
        "reason": "Wikidata items are recommended at the profile level",
        "discouraged": {
          "regex": [
            '^http(s?):\/\/.*wikidata.org\/entity\/P' //TODO: case insensitive for domain part?
          ]
        }
      }]
    }
  ]
};

module.exports = function () { return ConfigObject; };
