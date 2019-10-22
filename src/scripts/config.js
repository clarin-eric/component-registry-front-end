/** @module General configuration for Component Registry REST service */


var ConfigObject = {
  Config: {},
  ccrUrl: "",
  vocabulariesUrl: "",
  vocabularyItemsUrl: "",
  restUrl: "",
  adminUrl: "",
  webappUrl: "",
  loadingState: $.Deferred()
}


var configUrl = './compRegConfig.jsp' + window.location.search; //pass all query params

var configRetrieval = $.ajax({
  url: configUrl,
  dataType: "json",
  success: function(result) {
    console.log("Read configuration from '" + configUrl + "': ", JSON.stringify(result));

    var getUrl = function() {
      var trailingSlashPattern = /^(.*)(\/)$/;
      if(trailingSlashPattern.test(result.REST.url)) {
        //remove the trailing slash
        return result.REST.url.replace(trailingSlashPattern, "$1");
      } else {
        return result.REST.url;
      }
    };

    ConfigObject.Config = result;
    ConfigObject.ccrUrl = getUrl() + "/ccr";
    ConfigObject.vocabulariesUrl = getUrl() + "/vocabulary/conceptscheme";
    ConfigObject.vocabularyItemsUrl = getUrl() + "/vocabulary/items";
    ConfigObject.restUrl = getUrl() + "/rest";
    ConfigObject.adminUrl = getUrl() + "/admin";
    ConfigObject.webappUrl = getUrl();
    ConfigObject.loadingState.resolve();

    console.log("Configuration object constructed: " + JSON.stringify(ConfigObject));
  },
  error: function(jqxhr, status, error) {
    console.log("Configuration could not be loaded: " + error);
    ConfigObject.loadingState.rejectWith(jqxhr, {status: status, error: error});
  }
});

module.exports = function() {return ConfigObject;};
