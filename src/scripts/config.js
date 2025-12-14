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

var errorHandler = function (jqxhr, status, error) {
  console.log("Configuration could not be loaded: " + error);
  ConfigObject.loadingState.rejectWith(jqxhr, { status: status, error: error });
};

var configRetrieval = $.ajax({
  url: configUrl,
  dataType: "json",
  error: errorHandler,
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

    var restUrl = getUrl() + "/rest";
    ConfigObject.restUrl = restUrl;
    ConfigObject.conceptSearchUrl = restUrl + "/concepts/search";
    ConfigObject.vocabulariesUrl = getUrl() + "/vocabulary/vocabularies";
    ConfigObject.vocabularyItemsUrl = getUrl() + "/vocabulary/items";
    ConfigObject.vocabularyPageUrl = getUrl() + "/vocabulary/page";
    ConfigObject.adminUrl = getUrl() + "/admin";
    ConfigObject.webappUrl = getUrl();

    //load concept URI rules to finalize
    var conceptRulesUrl = restUrl + "/concepts/rules";
    $.ajax({
      url: conceptRulesUrl,
      dataType: "json",
      error: function() {
        console.log("FAILED to retrieve concept URI rules. Configuration object constructed: " + JSON.stringify(ConfigObject));
        ConfigObject.loadingState.resolve();
      },
      success: function (conceptRules) {
        ConfigObject.conceptRules = conceptRules;
        console.log("Configuration object constructed: " + JSON.stringify(ConfigObject));
        ConfigObject.loadingState.resolve();
      }
    });
  }
});

module.exports = function () { return ConfigObject; };
