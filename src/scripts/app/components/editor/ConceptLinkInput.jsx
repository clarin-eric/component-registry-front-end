'use strict';
var log = require('loglevel');

var React = require('react');

var ModalTrigger = require('../ModalTrigger');
var ConceptRegistryModal = require('./ConceptRegistryModal');
var getConfiguration = require('../../../config');
var ConceptEvaluator = require('../../service/ConceptEvaluator');
//bootstrap
var ValidatingTextInput = require('./ValidatingTextInput');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

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
    // <https://github.com/clarin-eric/component-registry-front-end/issues/175>
    var evaluator = ConceptEvaluator.evaluator(getConfiguration().conceptRules);
    var conceptEvaluation = evaluator.evaluateConceptLink(this.props.value, this.props.parentType);
    var discouraged = conceptEvaluation && conceptEvaluation['warning'];

    var {
      updateConceptLink, bsStyle, //wrap
      buttonAfter, type, conceptTypes, //swallow
      ...otherProps //rest for passing on
      } = this.props;

    return (
      <div>
        <ValidatingTextInput
          type="text"
          bsStyle={discouraged ? "warning" : bsStyle}
          buttonAfter={this.newConceptLinkDialogueButton(updateConceptLink, conceptTypes)}
          {...otherProps}
          />
          {discouraged && this.renderWarning(conceptEvaluation)}
      </div>
    );
  },

  renderWarning(evaluation) {
    return (
      <div className='conceptLinkEvaluationWarning form-group'>
        <div className='control-label editorFormLabel'></div>
        <div className='editorFormField alert alert-warning'>
          <Glyphicon glyph="warning-sign"/> {evaluation['reason']}
        </div>
      </div>
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
