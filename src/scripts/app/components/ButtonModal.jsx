'use strict';

var React = require('react/addons');

//bootstrap mixin
var OverlayMixin = require('react-bootstrap/lib/OverlayMixin');

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var Modal = require('react-bootstrap/lib/Modal');

/**
* ButtonModal - Bootstrap Modal dialog triggered by Button, utilising react-bootstrap OverlayMixin to control overlay display.
* @constructor
* @mixes OverlayMixin
*/
var ButtonModal = React.createClass({
      mixins: [OverlayMixin],
      getInitialState: function() {
        return {
          isModalOpen: false,
          description: this.props.desc
        };
      },
      getDefaultProps: function() {
        return { disabled: false };
      },
      onConfirm: function(evt) {
        this.toggleModal();
        this.props.action(evt);
      },
      toggleModal: function() {
        this.setState({
          isModalOpen: !this.state.isModalOpen
        });
      },
      componentWillReceiveProps: function(nextProps) {
        this.setState({ description: nextProps.desc });
      },
      render: function() {
        return <Button disabled={this.props.disabled} onClick={this.toggleModal}>{this.props.btnLabel}</Button>
      },
      renderOverlay: function() {
        if(!this.state.isModalOpen) {
          return <span/>;
        }

        var desc = (typeof this.props.desc === "string") ? ( <p className="modal-desc">{this.state.desc || this.props.desc}</p> ) : this.props.desc;
        return (
          <Modal bsStyle="primary" title={this.props.title} animation={false} backdrop={true} onRequestHide={this.toggleModal}>
            <div className="modal-body">
              {desc}
              <div className="modal-footer">
                <Button bsStyle="primary" onClick={this.onConfirm}>OK</Button>
                <Button onClick={this.toggleModal}>Cancel</Button>
              </div>
            </div>
          </Modal>
        );
      }
  });

  module.exports = ButtonModal;
