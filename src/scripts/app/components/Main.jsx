var log = require("loglevel");

var React = require("react"),
    Constants = require("../constants"),
    Fluxxor = require("fluxxor");

// Mixins
var FluxMixin = Fluxxor.FluxMixin(React);
var StoreWatchMixin = Fluxxor.StoreWatchMixin;
var WindowFocusMixin = require('../mixins/WindowFocusMixin');
var History = require('react-router').History;

// Components
var AuthState = require("./AuthState.jsx").AuthState;
var AlertsView = require("./AlertsView.jsx");
var About = require("./About");

// Boostrap
var PageHeader = require('react-bootstrap/lib/PageHeader');
var Alert = require('react-bootstrap/lib/Alert');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

var ReactAlert = require('../util/ReactAlert');

var getConfiguration = require("../../config");

/***
* Main - Default component and entry point to the application.
* @constructor
*/
var Main = React.createClass({

  mixins: [FluxMixin, StoreWatchMixin("AuthenticationStore", "MessageStore"), WindowFocusMixin, History],

  // Required by StoreWatchMixin
  getStateFromFlux: function() {
    var flux = this.getFlux();
    return {
      auth: flux.store("AuthenticationStore").getState(),
      messages: flux.store("MessageStore").getState()
    };
  },

  componentWillMount: function() {
    log.debug("Application main will mount");
    // select space and item according to params
    log.trace("Location", this.props.location);

    var queryParams = this.props.location.query;

    var itemId = queryParams.item || queryParams.itemId;
    var space = queryParams.registrySpace || queryParams.space;
    if(space === "group") {
      // "team" used to be "group"
      space = Constants.SPACE_TEAM;
    }
    var type = queryParams.type;
    var team = queryParams.teamId || queryParams.groupId;

    if(itemId != null) {
      //switch to correct space and type
      type = type || itemId.indexOf("clarin.eu:cr1:p_") >= 0?Constants.TYPE_PROFILE:Constants.TYPE_COMPONENT;

      log.debug("Selecting item from parameter. Type:",type, "- id:", itemId);
      this.getFlux().actions.jumpToItem(type, itemId);
      this.getFlux().actions.loadComponentSpec(type, itemId);
      //TODO (?) also support selecting view/xml/comments ('browserview' parameter)
    } else if(space != null || type != null) {
      // space specified (but not item). If no type specified, assume profile.
      type = type || Constants.TYPE_PROFILE;
      space = space || Constants.SPACE_PUBLISHED;
      this.getFlux().actions.switchSpace(type, space, team);
      this.getFlux().actions.loadItems(type, space, team);
    }
  },

  componentDidMount: function() {
    log.debug("Application main did mount");

    this.checkBrowserVersion();
    this.checkAuthState();

    // check auth state every 30s
    this.authInterval = setInterval(this.checkAuthState, 30*1000);

    // show message if version is alpha or beta
    if(__FRONT_END_VERSION__ != null)
    {
      var fev = __FRONT_END_VERSION__.toUpperCase();
      if(fev.includes('ALPHA') || fev.includes('BETA') || fev.includes('DEV')) {
        log.debug("Development version alert!");
        this.showTestingAlert();
      }
    } else {
      log.warn('Front end version string not set');
    }
  },

  onWindowFocus: function() {
    this.checkAuthState();
  },

  componentWillUnmount: function() {
    clearInterval(this.authInterval);
  },

  checkAuthState: function() {
    this.getFlux().actions.checkAuthState();
  },

  checkBrowserVersion: function() {
    var browser = require('detect-browser');
    if(browser.name && browser.version) {
      //parse major version for comparison
      var majorVersionPattern = /^(\d+).*/; //first digit group
      var majorVersionMatch = majorVersionPattern.exec(browser.version);
      if(majorVersionMatch) {
        var majorVersion = parseInt(majorVersionMatch[1]);
        if(majorVersion) {
          //check supported version depending on browser
          if(browser.name === 'chrome' && majorVersion < 48
              || browser.name == 'firefox' && majorVersion < 43
              || browser.name == 'safari' && majorVersion < 537) {
                log.warn("Unsupported browser version:", browser.name, browser.version);
                ReactAlert.showMessage("Browser compatibility warning",
                    <p>
                      <strong>Important notice:</strong> The Component Registry has not been tested with the current browser version.
                      Please use a newer version of Chrome, Firefox or Safari to make sure the application works as expected!
                    </p>);
                return;
          } else {
            log.debug("Browser version ok:", browser.name, browser.version);
            return;
          }
        }
      }
    }
    log.warn("Could not perform browser version check");
  },

  showTestingAlert: function() {
    ReactAlert.showMessage("Component Registry testing instance",
      <div>
        <p>
          This instance of the Component Registry is for testing purposes only. Do
          not use any of the components or profiles in this registry for production
          purposes as they are not guaranteed to persist.
        </p>
        <p>
          Please send any issues reports, questions or remarks to <a href="mailto:cmdi@clarin.eu">cmdi@clarin.eu</a>.
          Thanks for trying out the new Component Registry!
        </p>
    </div>);
  },

  handleDismissMessage: function(id) {
    this.getFlux().actions.dismissMessage(id);
  },

  render: function() {
    return (
        <div id="app-root">
          <div id="modal-container"/>
          <div id="header">
            <PageHeader className="hidden-xs">CMDI Component Registry</PageHeader>

            <div className="auth-login">
              <AuthState
                authState={this.state.auth.authState}
                history={this.history}
                location={this.props.location} />
            </div>
          </div>

          <div className="main container-fluid">
            <AlertsView messages={this.state.messages.messages} onDismiss={this.handleDismissMessage} />
            {this.props.children}
          </div>

          <div className="footer">
            <div className="version"><a title="About" onClick={this.showAbout}><Glyphicon glyph="info-sign" />&nbsp;Version {getConfiguration().Config.backEndVersion}</a></div>
            <div className="logo">
              <a href="https://www.clarin.eu">
                <img src="images/clarin.png" />
              </a>
            </div>
            <div className="contact"><a title="Contact" href="mailto:cmdi@clarin.eu"><Glyphicon glyph="envelope" />&nbsp;Contact us</a></div>
          </div>
        </div>
    );
  },

  showAbout: function() {
    ReactAlert.showMessage("About CMDI Component Registry", <About/>);
  }
});


module.exports = Main;
