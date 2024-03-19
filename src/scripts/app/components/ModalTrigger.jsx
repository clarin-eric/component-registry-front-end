'use strict';
var log = require('loglevel');

var React = require('react');
var ReactDOM = require('react-dom');

//bootstrap
var Button = require('react-bootstrap/lib/Button');

//utils
var update = require('react-addons-update');
var ReactAlert = require('../util/ReactAlert');
var classNames = require('classnames');

/**
* ModalTrigger - Bootstrap custom ModalTrigger utilising react-bootstrap Overlay. Manages dialog display for two components implementing Bootstrap Modal, TypeModal and ConceptRegistryModal.
* @constructor
*/
var ModalTrigger = React.createClass({
  propTypes: {
    modal: React.PropTypes.object.isRequired,
    label: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.object
    ]).isRequired,
    useLink: React.PropTypes.bool,
    modalTarget: React.PropTypes.string,
    onOpen: React.PropTypes.func,
    onClose: React.PropTypes.func,
    disabled: React.PropTypes.bool,
    bsSize: React.PropTypes.string,
    title: React.PropTypes.string,
    bsStyle: React.PropTypes.string
  },
  getDefaultProps: function() {
    return {
      useLink: false,
      disabled: false,
      modalTarget: ReactAlert.defaultContainer,
      bsSize: null
    }
  },
  getInitialState: function() {
    return {
      isModalOpen: false,
      position: {
        top: 0, left: 0
      }
    };
  },
  toggleModal: function(evt) {
      log.debug('modal visible: ', this.state.isModalOpen);

      if(this.state.isModalOpen) {
        //hide
        if(this.props.onClose) {
          this.props.onClose(evt);
        }
        ReactAlert.closeAlert(this.props.modalTarget, evt);
      } else {
        //show new alert
        if(this.props.onOpen) {
          this.props.onOpen(evt);
        }
        ReactAlert.renderAlert(this.props.modal, this.props.modalTarget);
      }

      this.setState({
        // position: (!this.state.isModalOpen) ? update(this.state.position, { $set: offset }) : { top: 0, left: 0 },
        isModalOpen: !this.state.isModalOpen
      });
  },
  render: function() {
    if(this.props.useLink)
      return (
        <a onClick={!this.props.disabled && this.toggleModal} className={classNames({disabled: this.props.disabled})} title={this.props.title}>{this.props.label}</a>
      )
    else
      return (
        <Button onClick={this.toggleModal} disabled={this.props.disabled} bsSize={this.props.bsSize} title={this.props.title} bsStyle={this.props.bsStyle}>
          {this.props.label}
        </Button>
      );
  }

});

module.exports = ModalTrigger;
