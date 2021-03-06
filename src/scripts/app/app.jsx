const log = require('loglevel');

const React = require("react"),
    ReactDOM = require("react-dom"),
    Fluxxor = require("fluxxor");

const ReactRouter = require('react-router');
const Router = ReactRouter.Router,
      Route = ReactRouter.Route,
      IndexRoute = ReactRouter.IndexRoute,
      hashHistory = ReactRouter.hashHistory;

const Browser = require("./components/browser/Browser.jsx"),
    Main = require("./components/Main.jsx"),
    Editor = require("./components/editor/Editor.jsx");
    EditorForm = require("./components/editor/EditorForm.jsx");

const ItemsStore = require("./stores/ItemsStore"),
    SelectionStore = require("./stores/SelectionStore"),
    ComponentDetailsStore = require("./stores/ComponentDetailsStore"),
    AuthenticationStore = require("./stores/AuthenticationStore"),
    MessageStore = require("./stores/MessageStore"),
    EditorStore = require("./stores/EditorStore"),
    TeamStore = require("./stores/TeamStore"),
    ValueSchemeStore = require("./stores/ValueSchemeStore");

const actions = require("./actions");

const getConfiguration = require('../config');

// main stylesheets
require('../../styles/main.sass');
require('../../styles/normalize.css');

/* Flux */
var stores = {
  ItemsStore: new ItemsStore(),
  SelectionStore: new SelectionStore(),
  ComponentDetailsStore: new ComponentDetailsStore(),
  AuthenticationStore: new AuthenticationStore(),
  MessageStore: new MessageStore(),
  EditorStore: new EditorStore(),
  TeamStore: new TeamStore(),
  ValueSchemeStore: new ValueSchemeStore()
};

var flux = new Fluxxor.Flux(stores, actions);
flux.setDispatchInterceptor(function(action, dispatch) {
  ReactDOM.unstable_batchedUpdates(function() {
    dispatch(action);
  });
});
window.flux = flux;

// Loading state promise (is deferred once configuration is loaded)
const configurationLoaded = getConfiguration().loadingState;
const configurationLoadingChecker = setInterval(function() {
  log.info("Waiting for configuration... state: ", configurationLoaded.state());
}, 1000);

configurationLoaded.then(function() {
  clearTimeout(configurationLoadingChecker);
  Config = getConfiguration().Config;

  /* Logging */

  // global log level
  log.setLevel(Config.loglevel || log.levels.INFO);

  // register on dispatch events
  if(log.getLevel() <= log.levels.DEBUG) {
    log.info("Logging Flux events at debug level");
    flux.on("dispatch", function(type, payload) {
      if (console && console.log) {
        log.debug("[Dispatch]", type, payload);
      }
    });
  }

  log.debug('Starting Component Registry front end version ' + __FRONT_END_VERSION__);
  log.debug('Mode: ' + process.env.NODE_ENV);

  /***
  * NotFound - Display for a non-configured route
  * @constructor
  */
  var NotFound = React.createClass({
    render: function() {
      return (
        <div className="main"><h1>Not Found</h1></div>
      );
    }
  });

  /* Routing */

  var createFluxComponent = function(Component, props) {
    return <Component {...props} flux={flux} />;
  };

  var routing = (
    <Router createElement={createFluxComponent} history={hashHistory}>
      <Route path="/" component={Main}>
        <IndexRoute component={Browser} />
        <Route path="browser" component={Browser} />
        <Route path="import" component={NotFound /*Import*/} />
        <Route path="editor/component/:space/:componentId" component={Editor} />
        <Route path="editor/component/new/:space/:componentId" component={Editor} />
        <Route path="editor/profile/:space/:profileId" component={Editor} />
        <Route path="editor/profile/new/:space/:profileId" component={Editor} />
        <Route path="editor/new/:space/:type" component={Editor} />
        <Route path="*" component={NotFound}/>
      </Route>
    </Router>
  );

  // Start the React application by rendering the router into the container element
  ReactDOM.render(routing, document.getElementById("app"));
  log.info("Application started");
}, function() {
  alert('Loading of configuration failed')
});
