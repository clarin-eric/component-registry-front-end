/** @module General configuration for Component Registry REST service */

var Config = {};
var _ccrUrl = "";
var _vocabulariesUrl = "";
var _vocabularyItemsUrl = "";
var _restUrl = "";
var _adminUrl = "";
var _webappUrl = "";
var _loadingState = $.Deferred();

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

    Config = result;
    _ccrUrl = getUrl() + "/ccr";
    _vocabulariesUrl = getUrl() + "/vocabulary/conceptscheme";
    _vocabularyItemsUrl = getUrl() + "/vocabulary/items";
    _restUrl = getUrl() + "/rest";
    _adminUrl = getUrl() + "/admin";
    _webappUrl = getUrl();
    _loadingState.resolve();
  },
  error: function(jqxhr, status, error) {
    console.log("Configuration could not be loaded: " + error);
    _loadingState.rejectWith(jqxhr, {status: status, error: error});
  }
});

module.exports = {
  loadingState: _loadingState,
  Config: Config,
  ccrUrl: _ccrUrl,
  vocabulariesUrl: _vocabulariesUrl,
  vocabularyItemsUrl: _vocabularyItemsUrl,
  restUrl: _restUrl,
  adminUrl: _adminUrl,
  webappUrl: _webappUrl
};
