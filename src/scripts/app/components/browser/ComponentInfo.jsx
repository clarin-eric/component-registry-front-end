var log = require("loglevel");

var React = require("react");
var ReactDOM = require("react-dom");
var Constants = require("../../constants");
var Config = require('../../../config');

//bootstrap
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
    team: React.PropTypes.string,
    history: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    return {clipboard: null};
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

    return (
      <div id={"componentInfoModal" + key}>
        <div>
          <a href={bookmarkLink}>Bookmark link:</a>
          <div>
            <input id="bookmarkLink" type="text" value={bookmarkLink} onChange={noop} />
            <button type="button" className="btn btn-default" data-clipboard-target="#bookmarkLink" title="Copy to clipboard">
              <span className="glyphicon glyphicon-copy" aria-hidden="true"/>
            </button>
          </div>
        </div>
        {xsdLink != null && xsdLink[key] != null && (
          <div>
            <a href={xsdLink[key]}>Link to xsd:</a>
            <div>
              <input id={"xsdLink" + key} type="text" value={xsdLink[key]} onChange={noop} />
              <button type="button" className="btn btn-default" data-clipboard-target={"#xsdLink" + key} title="Copy to clipboard">
                <span className="glyphicon glyphicon-copy" aria-hidden="true"/>
              </button>
            </div>
          </div>
        )}
      </div>
    );
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
    var bookmarkLink = Config.webappUrl + this.props.history.createHref("/", query);

    var xsdLink = type === Constants.TYPE_PROFILE ?
    {
      cmdi11: ComponentRegistryClient.getRegistryUrlCmdi11(type, item.id) + "/xsd",
      cmdi12: ComponentRegistryClient.getRegistryUrl(type, item.id) + "/xsd"
    } : null;

    return (
      <div id="componentInfoModal" className={this.props.className}>
        {xsdLink == null ? this.createTabContent(bookmarkLink) : (
          // if there are xsd links, show tabs because the links will be different for CMDI 1.1 and 1.2
            <Tabs activeKey="cmdi12">
              <Tab eventKey="cmdi11" title="CMDI 1.1">
                {this.createTabContent(bookmarkLink, xsdLink, 'cmdi11')}
              </Tab>
              <Tab eventKey="cmdi12" title="CMDI 1.2">
                {this.createTabContent(bookmarkLink, xsdLink, 'cmdi12')}
              </Tab>
            </Tabs>
          )
        }
      </div>
    );
  }
});

module.exports = ComponentInfo;
