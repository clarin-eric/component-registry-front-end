'use strict';
var log = require('loglevel');

var React = require('react');

var ModalTrigger = require('../ModalTrigger');
var ConceptRegistryModal = require('./ConceptRegistryModal');
var ConceptEvaluator = require('../../service/ConceptEvaluator');

//bootstrap
var ValidatingTextInput = require('./ValidatingTextInput');


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
    updateConceptLink: React.PropTypes.func.isRequired,
    parentType:  React.PropTypes.string.isRequired
  },

  render: function() {
    // Some concepts are (contextually) discouraged
    // TODO: provide a reason
    // <https://github.com/clarin-eric/component-registry-front-end/issues/175>
    var discouragedConceptClass = ConceptEvaluator.isDiscouraged(this.props.value, {
      "name": this.props.name,
      "parentType": this.props.parentType,
      "conceptTypes": this.props.conceptTypes
    });

    var {
      updateConceptLink, bsStyle, //wrap
      buttonAfter, type, conceptTypes, //swallow
      ...otherProps //rest for passing on
      } = this.props;

    return (
      <ValidatingTextInput
        type="text"
        bsStyle={discouragedConceptClass ? "warning" : bsStyle}
        addonAfter={discouragedConceptClass ? "Discouraged concept link!" : null}
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
