'use strict';
var log = require('loglevel');

var React = require('react');

//components
var Table = require('reactabular').Table;
var sortColumn = require('reactabular').sortColumn;

var ModalTrigger = require('../ModalTrigger');
var ExternalVocabularySelector = require('../ExternalVocabularySelector');
var ExternalVocabularyImport = require('./ExternalVocabularyImport');
var ConceptRegistryModal = require('./ConceptRegistryModal');
var VocabularyTable = require('./VocabularyTable');
var VocabularyBatchEditor = require('./VocabularyBatchEditor');

//bootstrap
var Button = require('react-bootstrap/lib/Button');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');
var Input = require('react-bootstrap/lib/Input');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var CmdiVersionModeMixin = require('../../mixins/CmdiVersionModeMixin');

//utils
var classNames = require('classnames');
var cloneDeep = require('lodash/cloneDeep');
var findIndex = require('lodash/findIndex');

//services
var ComponentRegistryClient = require('../../service/ComponentRegistryClient');

var OPEN_VOCAB = "open";
var CLOSED_VOCAB = "closed";

var VocabularyEditor = React.createClass({
    mixins: [ImmutableRenderMixin, CmdiVersionModeMixin],

    propTypes: {
      vocabulary: React.PropTypes.object,
      onVocabularyPropertyChange: React.PropTypes.func.isRequired,
      onRemoveVocabularyItem: React.PropTypes.func.isRequired,
      onAddVocabularyItem: React.PropTypes.func.isRequired,
      onSetVocabularyItems: React.PropTypes.func.isRequired,
      onChangeExternalVocab:  React.PropTypes.func.isRequired,
      onOk: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        externalVocabDetailsShown: false,
        checkingExternalVocab: false,
        batchEditingMode: false,
        externalVocabCheckResult: null,
        externalVocabCheckMessage: null
      }
    },

    addConceptLink: function(rowIndex, newHdlValue) {
      log.debug('add concept link to row', rowIndex, ":", newHdlValue);
      this.props.onVocabularyPropertyChange(rowIndex, '@ConceptLink', newHdlValue);
    },

    removeConceptLink: function(rowIndex) {
      log.debug("Remove concept link for row", rowIndex);
      this.props.onVocabularyPropertyChange(rowIndex, '@ConceptLink', null);
    },

    onChangeVocabType: function(evt) {
      var value = evt.target.value;
      log.debug("Vocab type changed to", value);
      if(value === OPEN_VOCAB) {
        //make open vocabulary.
        //TODO: Warn if items already defined... problem is that ReactAlert modal pops up below the type modal dialogue :(
        this.props.onChangeVocabularyType(OPEN_VOCAB);
      } else {
        //make closed vocabulary
        this.props.onChangeVocabularyType(CLOSED_VOCAB);
      }
    },

    onChangeExternalVocab: function(evt) {
      var target = evt.target;
      if(target.id === 'external-vocab-uri') {
        this.props.onChangeExternalVocab(
          target.value,
          this.props.vocabulary && this.props.vocabulary['@ValueProperty'] || null,
          this.props.vocabulary && this.props.vocabulary['@ValueLanguage'] || null);
      } else if(target.id === 'external-vocab-property') {
        this.props.onChangeExternalVocab(
          this.props.vocabulary && this.props.vocabulary['@URI'] || null,
          target.value,
          this.props.vocabulary && this.props.vocabulary['@ValueLanguage'] || null);
      } else if(target.id === 'external-vocab-language') {
        this.props.onChangeExternalVocab(
          this.props.vocabulary && this.props.vocabulary['@URI'] || null,
          this.props.vocabulary && this.props.vocabulary['@ValueProperty'] || null,
          target.value);
      }

      this.setState({
        checkingExternalVocab: false,
        externalVocabCheckResult: null
      })
    },

    unsetExternalVocab: function() {
      this.props.onChangeExternalVocab(null, null);
    },

    isClosedVocabulary: function() {
      return this.props.vocabulary && this.props.vocabulary.enumeration != null;
    },

    toggleExternalVocabDetails: function() {
      this.setState({
        externalVocabDetailsShown: !this.state.externalVocabDetailsShown
      })
    },

    toggleBatchEditingMode: function() {
      this.setState({
        batchEditingMode: !this.state.batchEditingMode
      });
    },

    handleCloseBatchEditor: function(items) {
      this.props.onSetVocabularyItems(items);
      this.toggleBatchEditingMode();
    },

    render: function() {
      var enumeration = this.props.vocabulary && this.props.vocabulary.enumeration;
      var vocabType = (this.isClosedVocabulary() || this.props.vocabulary == null && !this.isCmdi12Mode()) ? CLOSED_VOCAB : OPEN_VOCAB;
      var vocabUri = this.props.vocabulary && this.props.vocabulary['@URI'];
      var vocabValueProp = this.props.vocabulary && this.props.vocabulary['@ValueProperty'];
      var vocabValueLang = this.props.vocabulary && this.props.vocabulary['@ValueLanguage'];

      var vocabData = (enumeration != null && enumeration.item != undefined) ? enumeration.item : [];

      if(this.state.batchEditingMode) {
        var allowSubmit = false;
        var allowSubmitMessage = "Close batch editing mode before submiting";
      }
      else if(vocabType === CLOSED_VOCAB ) {
        var allowSubmit = vocabData && vocabData.length > 0;
        var allowSubmitMessage = allowSubmit ? "Use the defined closed vocabulary" : "A closed vocabulary should contain at least one item!";
      } else if(vocabType === OPEN_VOCAB) {
        var allowSubmit = this.isCmdi12Mode() && vocabUri != null && vocabUri.trim() != '';
        var allowSubmitMessage = allowSubmit ? "Use with the selected external vocabulary " + vocabUri : "An open vocabulary should be linked to an external vocabulary!";
      } else {
        var allowSubmit = false;
        var allowSubmitMessage = "Unknown vocabulary type";
      }

      var tableClasses = classNames('table','table-condensed');

      var vocabImportModalRef;
      var vocabImportCloseHandler = function(evt) {
        vocabImportModalRef.toggleModal();
      }

      return (
        <div className="vocabulary-editor">
          <Input type="select" label="Vocabulary type:" value={vocabType} onChange={this.onChangeVocabType} disabled={this.state.batchEditingMode}>
            <option value={OPEN_VOCAB} disabled={!this.isCmdi12Mode()}>Open</option>
            <option value={CLOSED_VOCAB}>Closed</option>
          </Input>
          {vocabType === OPEN_VOCAB && !this.isCmdi12Mode() &&
            <div className="error">
              <Glyphicon glyph="warning-sign"/>Open vocabularies are not supported in CMDI 1.1. Switch to CMDI 1.2 mode in the editor to set or modify an open vocabulary.
            </div>
          }
          {vocabType === CLOSED_VOCAB &&
            <div className="vocabulary-items">
              Closed vocabulary {vocabData.length > 3 ? '(' + vocabData.length + ' items)' : 'items'}:
              {this.state.batchEditingMode ?
                <VocabularyBatchEditor
                  items={vocabData}
                  onClose={this.handleCloseBatchEditor}
                  onCancel={this.toggleBatchEditingMode}
                  />
                :
                <VocabularyTable
                  items={vocabData}
                  addConceptLink={this.addConceptLink}
                  removeConceptLink={this.removeConceptLink}
                  onRemoveVocabularyItem={this.props.onRemoveVocabularyItem}
                  onVocabularyPropertyChange={this.props.onVocabularyPropertyChange}
                  addRow={this.props.onAddVocabularyItem}
                  readOnly={false}
                  />
              }
              {!this.state.batchEditingMode &&
                <div className="add-new-vocab">
                  <a onClick={this.props.onAddVocabularyItem}><Glyphicon glyph="plus-sign" /> Add an item</a>&nbsp;
                  <span><a onClick={this.toggleBatchEditingMode}><Glyphicon glyph="pencil" /> Batch editing mode</a>&nbsp;</span>
                  {vocabUri &&
                    <ModalTrigger
                      ref={function(modal) {
                         vocabImportModalRef = modal;
                       }}
                      modalTarget="externalVocabImportModalContainer"
                      label={<span><Glyphicon glyph="import" /> Import/update from the selected external vocabulary</span>}
                      useLink
                      modal={
                          <ExternalVocabularyImport
                            vocabularyUri={vocabUri}
                            valueProperty={vocabValueProp}
                            language={vocabValueLang}
                            onSetVocabularyItems={this.props.onSetVocabularyItems}
                            onClose={vocabImportCloseHandler} />
                      } />
                  }
                </div>
              }
              {vocabData == null || vocabData.length == 0 &&
                <div className="error">Add one or more items to this vocabulary to make it valid!</div>
              }
            </div>
          }
          {vocabType === OPEN_VOCAB &&
            <div>
              <Glyphicon glyph="info-sign"/> An open vocabulary is linked to an external vocabulary and cannot contain custom items.
              Metadata creators will be allowed to select a value from the external vocabulary OR enter their own (arbitrary) value.
              To define your own (restrictive) set of vocabulary items, select the <em>closed</em> vocabulary type.
              You can also import an external vocabulary into a closed vocabulary.
            </div>
          }
          {(this.isCmdi12Mode() || vocabUri || vocabValueProp || vocabValueLang) && this.renderExternalVocabularyEditor(vocabType, vocabUri, vocabValueProp, vocabValueLang)}
          <div className="modal-inline"><Button onClick={this.props.onOk} disabled={!allowSubmit} title={allowSubmitMessage}>Use Controlled Vocabulary</Button></div>
        </div>
      );
    },

    checkExternalVocab: function(vocabUri, vocabValueProp) {
      if(vocabUri == null || vocabValueProp == null) {
        //nothing to check
        return;
      }
      this.setState({
        checkingExternalVocab: true,
        externalVocabCheckResult: null,
        externalVocabCheckMessage: null
      });

      var onSuccess = function(data) {
        var validResult = $.isArray(data) && data.length > 0;
        log.debug("Vocabulary service response ok. Data validity:", validResult);
        this.setState({
          checkingExternalVocab: false,
          externalVocabCheckResult: validResult,
          externalVocabCheckMessage: validResult ? null : "No items in vocabulary or vocabulary does not exist."
        });
      }.bind(this);

      var onFailure = function(err) {
        log.warn("Vocabulary service responded with error:", err);
        this.setState({
          checkingExternalVocab: false,
          externalVocabCheckResult: false,
          externalVocabCheckMessage: "Service error: " + err
        });
      }.bind(this);

      ComponentRegistryClient.queryVocabularyItems(vocabUri, [vocabValueProp], onSuccess, onFailure, 0);
    },

    renderExternalVocabularyEditor: function(vocabType, vocabUri, vocabValueProp, vocabValueLang) {
      var modalRef;
      var closeHandler = function(evt) {
        modalRef.toggleModal();
      }

      var isOpen = (vocabType === OPEN_VOCAB);
      var isClosed = (vocabType === CLOSED_VOCAB);

      var checkDisabled = vocabUri == null || vocabValueProp == null || this.state.checkingExternalVocab;

      return (
        <div className="external-vocab-editor">
          {!vocabUri && isOpen &&
            <div className="error">Please select or define an external vocabulary for this open vocabulary (or change type to <em>closed</em>)</div>}
          {isClosed && this.isCmdi12Mode() &&
            <div><strong>Optionally</strong> select or define an <em>external vocabulary</em> for this closed vocabulary. You can choose to import the items of the selected external vocabulary into the current vocabulary.</div>}
          {vocabUri && isClosed && !this.isCmdi12Mode() &&
            <div className="error">An <em>external vocabulary</em> is defined for the present vocabulary. While in CMDI 1.1 editing mode, you can remove the link but not edit it or any of the related properties.</div>}
          <div>
            External vocabulary: {vocabUri &&
              <span><span className="disabledLink">{vocabUri}</span> <a className="remove" onClick={this.unsetExternalVocab} style={{cursor: 'pointer'}}>&#10007;</a></span>
            } {!vocabUri && "none"} &nbsp;
            <ModalTrigger bsSize="small"
              ref={function(modal) {
                 modalRef = modal;
               }}
              modalTarget="externalVocabModalContainer"
              label="Search"
              disabled={!this.isCmdi12Mode()}
              modal={
                  <ExternalVocabularySelector
                    initialSelectionUri={vocabUri}
                    onSelect={this.props.onChangeExternalVocab} onClose={closeHandler} />
              } />
          </div>
          <div>
            <a onClick={this.toggleExternalVocabDetails}>{this.state.externalVocabDetailsShown ? "Hide details":"Show/edit details"}</a>
            {this.state.externalVocabDetailsShown && /* show external vocab details */
              <div className="external-vocab-editor-details">
                <Input id="external-vocab-uri"
                   type="text"
                   label="URI:"
                  value={vocabUri || ""}
                  disabled={!this.isCmdi12Mode()}
                  onChange={this.onChangeExternalVocab}
                  onBlur={this.checkExternalVocab.bind(this, vocabUri, vocabValueProp)}
                  />
                <Input id="external-vocab-property"
                  type="text"
                  label="Value property:"
                  value={vocabValueProp || ""}
                  disabled={!this.isCmdi12Mode()}
                  onChange={this.onChangeExternalVocab}
                  onBlur={this.checkExternalVocab.bind(this, vocabUri, vocabValueProp)}
                  />
                <Input id="external-vocab-language"
                  type="text"
                  label="Value language:"
                  value={vocabValueLang || ""}
                  disabled={!this.isCmdi12Mode()}
                  onChange={this.onChangeExternalVocab} />
                <Button bsSize="small"
                  onClick={this.checkExternalVocab.bind(this, vocabUri, vocabValueProp)}
                  disabled={checkDisabled}>Check</Button>&nbsp;
                {this.state.checkingExternalVocab && "Please wait..."}
                {!checkDisabled && this.state.externalVocabCheckResult != null && (this.state.externalVocabCheckResult ?
                  <span><Glyphicon glyph="ok"/> Checked, vocabulary ok! {this.state.externalVocabCheckMessage}</span>
                  : <span className="error"><Glyphicon glyph="warning-sign"/> Failed! {this.state.externalVocabCheckMessage}</span>)}
              </div>
            }
          </div>
        </div>
      );
    }

});

module.exports = VocabularyEditor;
