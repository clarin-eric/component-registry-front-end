'use strict';

var log = require('loglevel');

var React = require('react');

//router bootstrap
var LinkContainer = require('react-router-bootstrap').LinkContainer;

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var ButtonGroup = require('react-bootstrap/lib/ButtonGroup');
var Modal = require('react-bootstrap/lib/Modal');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

var MoveToTeamDropdown = require('./MoveToTeamDropdown');
var ComponentStatusSelector = require('./ComponentStatusSelector');
var ButtonModal = require('../ButtonModal');
var PublishDropDown = require('../PublishDropDown');

var Constants = require('../../constants');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var ComponentUsageMixin = require('../../mixins/ComponentUsageMixin');

/**
* BtnMenuGroup - displays the Bootstrap button group used to apply actions on selected profile(s) or component(s) in the data grid (default route) or on the current item in the editor.
* @constructor
*/
var BrowserMenuGroup = React.createClass({
  mixins: [ImmutableRenderMixin, ComponentUsageMixin],
  propTypes: {
    type: React.PropTypes.string.isRequired,
    space: React.PropTypes.string.isRequired,
    items: React.PropTypes.object,
    selectedItemRights: React.PropTypes.object,
    teams: React.PropTypes.array,
    loggedIn: React.PropTypes.bool.isRequired,
    userId:  React.PropTypes.number,
    moveToTeamEnabled: React.PropTypes.bool,
    moveToTeam: React.PropTypes.func,
    deleteComp: React.PropTypes.func,
    onPublish: React.PropTypes.func,
    onStatusChange: React.PropTypes.func,
    onSetSuccessor: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      items: {},
      teams: [],
      moveToTeam: false
    };
  },

  render: function () {
    var isPublished = this.props.space === Constants.SPACE_PUBLISHED;
    var selectionCount = this.props.items == null ? 0 : Object.keys(this.props.items).length;

    //singleItem: false if item count <> 1, otherwise the unique selected item
    var singleItem = selectionCount == 1 && this.props.items[Object.keys(this.props.items)[0]];

    return (
      <div>
        <ButtonGroup className="actionMenu">

          <LinkContainer to={{pathname: "/editor/new/"+this.props.space+"/"+this.props.type}}
            disabled={!this.props.loggedIn}>
            <Button title="Create a new component or profile"><Glyphicon glyph="plus" /> New</Button>
          </LinkContainer>

          {this.renderEditorLink(singleItem)}

          {this.props.moveToTeamEnabled
            && <MoveToTeamDropdown
            title="Move to team"
            glyph="cloud-upload"
            space={this.props.space}
            teams={this.props.teams}
            selectedTeam={this.props.selectedTeam}
            disabled={selectionCount == 0}
            moveToTeam={this.props.moveToTeam} />}

          {!isPublished && (
              <PublishDropDown
                id="publishActions"
                title="Publish"
                glyph="upload"
                disabled={selectionCount != 1 || !this.props.loggedIn || singleItem.status.toLowerCase() === Constants.STATUS_DEPRECATED.toLowerCase()}
                onPublish={this.props.onPublish} />)}

          <ButtonModal {...this.props} action={this.props.deleteComp.bind(null, this.handleUsageWarning)} disabled={!this.props.loggedIn || selectionCount == 0 }
            btnLabel={<span title="Delete selected item(s)"><Glyphicon glyph="trash" /> Delete</span>}
            title="Delete items"
            desc={selectionCount == 0 ? null : this.renderDeleteModal()} />

        </ButtonGroup>

        <ButtonGroup className="actionMenu">
          {this.renderStatusDropdown(isPublished, selectionCount)}
          {singleItem && this.renderSuccessorButton(singleItem)}
        </ButtonGroup>
      </div>
    );
  },

  renderEditorLink: function(singleItem) {
    if(singleItem) {
      var rights = this.props.selectedItemRights;

      var isEditable;
      if (rights !== undefined && rights !== null) {
        log.debug("Setting edit state from item rights provided by service:", rights);
        isEditable = (rights.canWrite === "true");
      } else {
        isEditable =
          (this.props.userId == null || this.props.userId === singleItem.userId || this.props.space == Constants.SPACE_TEAM)
          && singleItem.status.toLowerCase() == Constants.STATUS_DEVELOPMENT.toLowerCase();
      }

      var editBtnLabel = isEditable ? "Edit" : "Edit as new";

      var editorRoute = null;
      if(this.props.type === Constants.TYPE_PROFILE) {
        editorRoute = "/editor" + ((isEditable) ? "/profile/" : "/profile/new/")
          + this.props.space + "/" + singleItem.id;
      } else if(this.props.type === Constants.TYPE_COMPONENT) {
        editorRoute = "/editor" + ((isEditable) ? "/component/" : "/component/new/")
          + this.props.space + "/" + singleItem.id;
      }

      if(editorRoute != null) {
        return (
          <LinkContainer to={{pathname: editorRoute}} disabled={!this.props.loggedIn}>
            <Button title="Edit selected (as new)" bsStyle="primary">
                <Glyphicon glyph="pencil" /> {editBtnLabel}
            </Button>
          </LinkContainer>
        );
      }
    } else {
      return (<Button bsStyle="primary" disabled><Glyphicon glyph="pencil" /> Edit</Button>);
    }
  },

  renderStatusDropdown: function(isPublished, selectionCount) {
    if(selectionCount == 1) {
      var item = this.props.items[Object.keys(this.props.items)[0]];
      var status = item.status.toLowerCase();
    }
    return (<ComponentStatusSelector
      item={item}
      disabled={!this.props.loggedIn || item == null}
      onStatusChange={this.props.onStatusChange}
      developmentAllowed={false /* never possible to change to development*/ }
      productionAllowed={isPublished && status == Constants.STATUS_DEVELOPMENT.toLowerCase() /* only can go from development to published in public space */}
      deprecatedAllowed={status != Constants.STATUS_DEPRECATED.toLowerCase() /* can always deprecate (or request deprecation) */}
       />);
  },

  renderSuccessorButton: function(item) {
    if(item.status.toLowerCase() == Constants.STATUS_DEPRECATED.toLowerCase()) {
      return (
        <Button
          onClick={this.props.onSetSuccessor}
          disabled={!this.props.loggedIn || item.successor != null && item.successor != ""}>
          Set successor
        </Button>
      );
    } else {
      return null;
    }
  },

  renderDeleteModal: function() {
    var deleteIdList = [];
    var selectionCount = this.props.items == null ? 0 : Object.keys(this.props.items).length;
    if(selectionCount > 0)
      Object.keys(this.props.items).forEach(function(id, index) {
        var name = this.props.items[id].name;
        deleteIdList.push(React.createElement('li', { key: id }, name));
      }.bind(this));

    var warnPublic = (this.props.space === Constants.SPACE_PUBLISHED)?(
      <p>
        <strong>Note</strong>: deletion from the public space is only allowed
        by the owner of the item within one month after publication. If these
        criteria are not met, you will get an error message indicating a
        failed or forbidden attempt to delete.
      </p>
    ):null;

    return (
      <div className="modal-desc">You will delete the following item(s):
        <ul>{deleteIdList}</ul>
        <p>This cannot be undone.</p>
        {warnPublic}
      </div>
    );
  },

  /**
   * Required by ComponentUsageMixin
   */
  renderUsageModalContent: function(errors, doContinue, doAbort) {
    return [(
      <Modal.Body key="body">
        <div className="modal-desc">
          <div>One of the component you are trying to delete is used in the following component(s) and/or profile(s):
            <ul>{errors}</ul>
          </div>
        </div>
      </Modal.Body>
    ), (
      <Modal.Footer key="footer">
        <div>
          <strong>One or more components have not been deleted!</strong><br/>
          To delete this component, please first delete the components and/or profiles listed above.
        </div>
        <Button onClick={doAbort}>Ok</Button>
      </Modal.Footer>
    )];
  }
});

module.exports = BrowserMenuGroup;
