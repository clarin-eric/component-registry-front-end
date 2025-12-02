'use strict';
var log = require('loglevel');

var React = require('react');

var ModalTrigger = require('../ModalTrigger');
var ConceptRegistryModal = require('./ConceptRegistryModal');

//bootstrap
var ValidatingTextInput = require('./ValidatingTextInput');

var isocatPattern = /^http(s?):\/\/www\.isocat\.org/;


/**
* ConceptLinkInput - Text input with button to trigger CCR search
*
* @constructor
*/
var ConceptLinkInput = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    value: React.PropTypes.string.isRequired,
    conceptTypes: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired,
    updateConceptLink: React.PropTypes.func.isRequired
  },

  render: function() {
    // if link is an old ISOcat link, user should be warned
    // /<https://github.com/clarin-eric/react-webpack-comp-reg/issues/15>
    var isocatLink = isocatPattern.test(this.props.value);

    var {
      updateConceptLink, bsStyle, //wrap
      buttonAfter, type, conceptTypes, //swallow
      ...otherProps //rest for passing on
      } = this.props;

    return (
      <ValidatingTextInput
        type="text"
        bsStyle={isocatLink ? "warning" : bsStyle}
        addonAfter={isocatLink ? "ISOcat links are deprecated!" : null}
        buttonAfter={this.newConceptLinkDialogueButton(updateConceptLink, conceptTypes)}
        {...otherProps}
        />
    );
  },

  newConceptLinkDialogueButton: function(changeHandler, conceptTypes, label, ref, closeHandler) {
    if(ref == null) {
     ref = "modalTrigger";
   }
   if(closeHandler == null) {
     closeHandler = this.closeConceptLinkDialogue.bind(this,ref);
   }

    return <ModalTrigger
      ref={ref}
      modalTarget="ccrModalContainer"
      label={label != null ? label : "Search in concept registry..."}
      modal={
        <ConceptRegistryModal
          onClose={closeHandler}
          onSelect={changeHandler}
          conceptTypes={conceptTypes}
          container={this} />
      } />
  },

  closeConceptLinkDialogue: function(ref, evt) {
    this.refs[ref].toggleModal(evt);
  }
});

module.exports = ConceptLinkInput;
