'use strict';

var log = require('loglevel');

var React = require('react');
var {Route} = require('react-router');

var Constants = require("../constants");

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//bootstrap
var ButtonGroup =  require('react-bootstrap/lib/ButtonGroup');
var DropdownButton = require('react-bootstrap/lib/DropdownButton');
var MenuItem = require('react-bootstrap/lib/MenuItem');
var Button = require('react-bootstrap/lib/Button');
var ButtonLink = require('react-router-bootstrap').ButtonLink;

//utils
//var auth = require('./Authentication').auth;
var classNames = require('classnames');


var PUBLIC = Constants.SPACE_PUBLISHED;
var PRIVATE = Constants.SPACE_PRIVATE;
var GROUP = Constants.SPACE_GROUP;

var COMPONENTS = Constants.TYPE_COMPONENTS;
var PROFILES = Constants.TYPE_PROFILE;

var GROUP_PREFIX = "group_";

/**
* SpaceSelector - selector or switcher between public, private and/or group spaces and component or profile types.
* @constructor
*/
var SpaceSelector = React.createClass({
  mixins: [ImmutableRenderMixin],
  propTypes: {
    space: React.PropTypes.string,
    type: React.PropTypes.string,
    componentsOnly: React.PropTypes.bool,
    multiSelect: React.PropTypes.bool,
    allowMultiSelect: React.PropTypes.bool,
    validUserSession: React.PropTypes.bool,
    onSpaceSelect: React.PropTypes.func,
    onToggleMultipleSelect: React.PropTypes.func,
    groups: React.PropTypes.array,
    selectedGroup: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      allowMultiSelect: true,
      multiSelect: false,
      componentsOnly: false,
      groups: [],
      selectedGroup: null
    };
  },

  selectSpace: function(space) {
    var spaceId, groupId;
    if(space == PUBLIC || space == PRIVATE) {
      this.props.onSpaceSelect(this.props.type, space);
    } else if(space.indexOf(GROUP_PREFIX) == 0) {
      var groupId = space.substring(GROUP_PREFIX.length);
      log.debug("Selected group", groupId);
      this.props.onSpaceSelect(this.props.type, GROUP, groupId);
    }
  },

  selectType: function(type) {
    this.props.onSpaceSelect(type, this.props.space, this.props.group);
  },

  types: {
    [PROFILES]: {
      label: "Profiles"
    },
    [COMPONENTS]: {
      label: "Components"
    }
  },

  getSpaces: function() {
    var spaces = {
      [PUBLIC]: {
        label: Constants.SPACE_NAMES[PUBLIC],
        loginRequired: false
      },
      [PRIVATE]: {
        label: Constants.SPACE_NAMES[PRIVATE],
        loginRequired: true
      }
    }

    // add group spaces
    if(this.props.groups != null) {
      var groups = this.props.groups;
      for(var i=0;i<(groups.length);i++) {
        log.trace("Group", groups[i]);
        var groupId = GROUP_PREFIX + groups[i].id;
        spaces[groupId] = {
          label: groups[i].name,
          loginRequired: true
        }
      }
    }
    return spaces;
  },

  getCurrentSpace: function() {
    if(this.props.space == PUBLIC || this.props.space == PRIVATE) {
      return this.props.space;
    } else if(this.props.space == Constants.SPACE_GROUP && this.props.selectedGroup != null) {
      return GROUP_PREFIX + this.props.selectedGroup;
    } else {
      return null;
    }
  },

  render: function() {
    var showMultiSelect = this.props.allowMultiSelect;

    var spaces = this.getSpaces();
    var currentSpace = this.getCurrentSpace();

    var types = this.types;
    var currentType = this.props.type;

    return (
      <div className="left">
        <ButtonGroup className="space_selector">

          {/* Public, private, groups */}
          <DropdownButton title={spaces[currentSpace].label}
            disabled={!this.props.validUserSession && currentSpace == PUBLIC}>
              {Object.keys(spaces).map(spaceKey => (
                  <MenuItem
                    key={spaceKey}
                    className={classNames({ selected: (spaceKey === currentSpace) })}
                    onSelect={this.selectSpace.bind(this, spaceKey)}>
                      {spaces[spaceKey].label}
                  </MenuItem>
                )
              )}
          </DropdownButton>

          {/* Components, profiles */}
          {!this.props.componentsOnly && (
            <DropdownButton title={types[currentType].label}
              disabled={(!this.props.validUserSession && currentSpace != PUBLIC)}>
                {Object.keys(types).map(typeKey => (
                    <MenuItem
                      key={typeKey}
                      className={classNames({ selected: (typeKey === currentType) })}
                      onSelect={this.selectType.bind(this, typeKey)}>
                        {types[typeKey].label}
                    </MenuItem>
                  )
                )}
            </DropdownButton>
        )}

          {/* Toggle multiselect */}
          {showMultiSelect && (
            <Button bsStyle={(this.props.multiSelect) ? "primary" : "info"}
                    onClick={this.props.onToggleMultipleSelect}>Toggle Select Mode</Button>
          )}

        </ButtonGroup>
      </div>
    );
  }
});

module.exports = SpaceSelector;
