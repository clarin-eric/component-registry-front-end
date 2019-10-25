'use strict';

var log = require('loglevel');

var React = require('react');

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var ButtonGroup = require('react-bootstrap/lib/ButtonGroup');
var ButtonModal = require('../ButtonModal');
var PublishDropDown = require('../PublishDropDown');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

/**
* EditorMenuGroup
* @constructor
*/
var EditorMenuGroup = React.createClass({
  propTypes: {
    forceNew: React.PropTypes.bool,
    onSave: React.PropTypes.func,
    onSaveNew: React.PropTypes.func,
    onPublish: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    disabled: React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      disabled: true
    };
  },

  render: function () {
    return (
      <ButtonGroup className="actionMenu">
        <Button bsStyle={(!this.props.forceNew) ? "primary" : "default" } onClick={this.props.onSave} disabled={this.props.disabled || this.props.forceNew}><Glyphicon glyph="save"/> Save</Button>
        <Button bsStyle={(this.props.forceNew) ? "primary" : "default" } onClick={this.props.onSaveNew} disabled={this.props.disabled}><Glyphicon glyph="export"/> Save new</Button>
        <PublishDropDown id="publishActions" title="Publish" disabled={this.props.disabled || this.props.forceNew} onPublish={this.props.onPublish} glyph="upload"/>
        <Button onClick={this.props.onCancel} disabled={this.props.disabled}><Glyphicon glyph="ban-circle"/> Cancel</Button>
      </ButtonGroup>
    );
  }
});

module.exports = EditorMenuGroup;
