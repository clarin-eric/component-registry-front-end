'use strict';
var log = require('loglevel');
var React = require('react');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

require('../../../styles/ActionButtons.sass'); // TODO apply image styles to links

/**
* ActionButtons - Generates button links displayed inline and used to apply ordering or remove actions to a CMDComponent, CMDElement or CMDAttribute.
* @constructor
*/
var ActionButtons = React.createClass({
  propTypes: {
    onMove: React.PropTypes.func,
    onRemove: React.PropTypes.func,
    moveUpEnabled: React.PropTypes.bool,
    moveDownEnabled: React.PropTypes.bool,
    onToggleExpansion: React.PropTypes.func,
    isExpanded: React.PropTypes.bool,
    isSelected: React.PropTypes.bool,
    isLinked:  React.PropTypes.bool,
    title: React.PropTypes.object
  },
  getDefaultProps: function() {
    return {
      moveUpEnabled: true,
      moveDownEnabled: true,
      isLinked: false
    };
  },
  render: function() {

    var linkGlyph = this.props.isLinked ?
    <Glyphicon title="Linked component" glyph="link" />
    : null;

    return (
      <div className="controlLinks">
        {this.props.onToggleExpansion && (
          <div className="expandCollapse">
            {!this.props.isExpanded &&
              <a className="expand" onClick={this.props.onToggleExpansion}><span className="glyphicon glyphicon-expand"></span></a>
            }
            {this.props.isExpanded &&
              <a className="expand" onClick={this.props.onToggleExpansion}><span className="glyphicon glyphicon-collapse-down"></span></a>
            }
          </div>
        )}
        <div className="title">
          {this.props.title}
          {linkGlyph}
        </div>
        <div className="moveRemove pull-right">
          {this.props.onMove &&
            <div className="posControl">
              {this.props.moveUpEnabled ? (<a title="Move up" onClick={this.props.onMove.bind(this, "up")}><span className="glyphicon glyphicon-circle-arrow-up"></span></a>): <span className="glyphicon glyphicon-circle-arrow-up disabled"></span>}
              {this.props.moveDownEnabled ? (<a title="Move down" onClick={this.props.onMove.bind(this, "down")}><span className="glyphicon glyphicon-circle-arrow-down"></span></a>): <span className="glyphicon glyphicon-circle-arrow-down disabled"></span>}
            </div>
          }
          {this.props.onRemove &&
            <a className="remove" title="Remove" onClick={this.props.onRemove}><span className="glyphicon glyphicon-remove-circle"></span></a>
          }
        </div>
      </div>
    );
  }
});

module.exports = ActionButtons;
