var log = require("loglevel");

var React = require("react");
var ReactDOM = require("react-dom");
var Constants = require("../../constants");
var getConfiguration = require('../../../config');

//bootstrap
var Glyphicon = require('react-bootstrap/lib/Glyphicon');
var Tabs = require('react-bootstrap/lib/Tabs');
var Tab = require('react-bootstrap/lib/Tab');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//utils
var ComponentRegistryClient = require('../../service/ComponentRegistryClient');
var Clipboard = require('clipboard');

require('../../../../styles/Browser.sass');

var ComponentInfo = React.createClass({
  mixins: [ImmutableRenderMixin],

  propTypes: {
    item: React.PropTypes.object.isRequired,
    space: React.PropTypes.string.isRequired,
    type: React.PropTypes.string.isRequired,
    router: React.PropTypes.object.isRequired,
    team: React.PropTypes.string
  },

  getInitialState: function() {
    return {clipboard: null, currentTab: "cmdi12"};
  },

  componentDidMount: function() {
    var cb = new Clipboard("#" + ReactDOM.findDOMNode(this).id + " .btn");
    log.trace("Init clipboard", cb);
    this.setState({clipboard: cb})
  },

  componentWillUnmount: function() {
    if(this.state.clipboard != null) {
      log.trace("Destroying clipboard", this.state.clipboard);
      //as advised...
      this.state.clipboard.destroy();
      this.setState({clipboard: null});
    }
  },

  createTabContent: function(bookmarkLink, xsdLink, key) {
    //not setting onChange to the inputs will generate a warning unless readOnly
    //is set, which does not yield the desired behaviour, therefore a noop function is passed
    var noop = function() {};
    var showXsdLink = (xsdLink != null && xsdLink[key] != null)

    return (
      <div id={"componentInfoModal" + key}>
        <div>
          <a href={bookmarkLink} target="_blank">Bookmark link:</a>
          <div>
            <input id={"bookmarkLink" + key} type="text" value={bookmarkLink} onChange={noop} />
            <button type="button" className="btn btn-default" data-clipboard-target={"#bookmarkLink" + key} title="Copy to clipboard">
              <span className="glyphicon glyphicon-copy" aria-hidden="true"/>
            </button>
          </div>
        </div>
        {showXsdLink && (
          <div>
            <a href={xsdLink[key]}>Link to XSD (XML Schema):</a>
            <div>
              <input id={"xsdLink" + key} type="text" value={xsdLink[key]} onChange={noop} />
              <button type="button" className="btn btn-default" data-clipboard-target={"#xsdLink" + key} title="Copy to clipboard">
                <span className="glyphicon glyphicon-copy" aria-hidden="true"/>
              </button>
            </div>
          </div>
        )}
        {!showXsdLink &&
          <div>XSD (XML Schema) link is only available for profiles</div>
        }
      </div>
    );
  },

  onTabSelect: function(key) {
    this.setState({currentTab: key});
  },

  render: function(item, contentId) {
    var item = this.props.item;
    var space = this.props.space;
    var type = this.props.type;

    var query = {
      itemId: item.id,
      registrySpace: space
    };
    if(space === Constants.SPACE_TEAM) {
      query.groupId = this.props.team;
    }
    var bookmarkLink = getConfiguration().webappUrl + this.props.router.createHref({pathname: "/", query: query});

    var xsdLink = type === Constants.TYPE_PROFILE ?
    {
      cmdi11: ComponentRegistryClient.getRegistryUrl(type, item.id, Constants.CMD_VERSION_1_1) + "/xsd",
      cmdi12: ComponentRegistryClient.getRegistryUrl(type, item.id, Constants.CMD_VERSION_1_2) + "/xsd"
    } : null;

    log.debug("Router", this.props.router, "Query: ", query);

    return (
      <div id="componentInfoModal" className={this.props.className}>
      <h5>Type</h5>{type === Constants.TYPE_PROFILE ? 'Profile' : 'Component'}
      <h5>Identifier</h5>{item.id}
      <h5>Links</h5>
        {/* if there are xsd links, show tabs because the links will be different for CMDI 1.1 and 1.2 */}
        {xsdLink == null ? this.createTabContent(bookmarkLink) :
            <Tabs activeKey={this.state.currentTab}
              onSelect={this.onTabSelect}>
              <Tab eventKey="cmdi11" title="CMDI 1.1">
                {this.createTabContent(bookmarkLink, xsdLink, 'cmdi11')}
              </Tab>
              <Tab eventKey="cmdi12" title="CMDI 1.2">
                {this.createTabContent(bookmarkLink, xsdLink, 'cmdi12')}
              </Tab>
              <Tab eventKey="help" title={(<Glyphicon glyph='question-sign' />)}>
                <div>
                  <p><strong>Choosing between CMDI 1.1 and 1.2</strong></p>
                  <p>
                    All profiles are available in two versions:
                    CMDI 1.1 and CMDI 1.2. The latter was introduced in 2016 and
                    provides new features and has a separate XML namespace for
                    each profile. While all components of the core CLARIN
                    infrastructure support both versions, some tools may only
                    support one.
                    CMDI 1.1 instances can be converted to CMDI 1.2
                    instances without loss of information. Instances in both
                    versions of CMDI can exist independently.
                  </p>
                  <p>
                    If you know what tool(s) your metadata will be processed with,
                    choose CMDI 1.2 if you know it is supported. Most likely this
                    applies if your metadata will only be processed by the core
                    infrastructure (e.g. VLO). <strong>If you are not sure which
                    version to choose, it's best to use CMDI 1.1.</strong>
                  </p>
                  <p>
                    For more information, go to <a
                    href="http://www.clarin.eu/cmdi12" target="_blank">
                      www.clarin.eu/cmdi12
                    </a>.
                  </p>
                </div>
              </Tab>
            </Tabs>
        }
      </div>
    );
  }
});

module.exports = ComponentInfo;
