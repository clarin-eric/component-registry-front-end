'use strict';
var log = require('loglevel');

var React = require('react');
var update = require('react-addons-update');

//components
var ModalTrigger = require('../ModalTrigger');

//bootstrap
var Glyphicon = require('react-bootstrap/lib/Glyphicon');
var Input = require('react-bootstrap/lib/Input');
var Button = require('react-bootstrap/lib/Button');
var Modal = require('react-bootstrap/lib/Modal');
var Alert = require('react-bootstrap/lib/Alert');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');
var CmdiVersionModeMixin = require('../../mixins/CmdiVersionModeMixin');
var ValidatingComponentMixin = require('../../mixins/ValidatingComponentMixin');

//utils
var Validation = require('../../service/Validation')
var update = require('react-addons-update');

var languageCodes = require('../../../languageCodes');

/**
* DocumentationInput - one text input per documentation element and controls to add/remove elements as well as set content language codes for each element (see DocumentationLanguageModal below)
*
* @constructor
*/
var DocumentationInput = React.createClass({
  mixins: [ImmutableRenderMixin, CmdiVersionModeMixin, ValidatingComponentMixin],

  propTypes: {
    value: React.PropTypes.array,
    onChange: React.PropTypes.func.isRequired
  },

  componentDidUpdate: function(prevProps) {
    if(!this.isValid() && this.isValidated() && this.props.value !== prevProps.value) {
      //currently invalid and value has changed (text value or language code modified) - revalidate
      this.doValidate();
    }
  },

  updateValue: function(index, evt) {
    var newValue = evt.target.value;
    var doc = this.props.value;
    if(doc == null || !$.isArray(doc) || doc.length == 0) {
      //no documentation set yet - make a new array
      this.props.onChange([{'$': newValue}]);
    } else {
      if(newValue === '' && doc.length <= 1) {
        log.debug('Documentation has become empty');
        this.props.onChange(undefined);
      } else {
        var currentDoc = doc[index];
        var newDoc = {'$': newValue};
        if(currentDoc != null) {
          var newDoc = update(currentDoc, {$merge: newDoc});
        }
        this.props.onChange(update(doc, {$splice: [[index, 1, newDoc]]}));
      }
    }
  },

  updateLanguageCode: function(index, languageCode) {
    log.debug("Update language code", index, languageCode);
    var doc = this.props.value;
    if(doc == null || !$.isArray(doc) || doc.length == 0) {
      //no documentation set yet - make a new array
      this.props.onChange([{'$': '', '@lang': languageCode}]);
    } else {
      var currentDoc = doc[index];
      if(currentDoc == null) {
        var newDoc = {'$': '', '@lang': languageCode};
      } else {
        var newDoc = update(currentDoc, {$merge: {'@lang': languageCode}});
      }
      this.props.onChange(update(doc, {$splice: [[index, 1, newDoc]]}));
    }
  },

  addDoc: function() {
    var doc = this.props.value;
    if(doc == null || !$.isArray(doc) || doc.length == 0) {
      if(doc != null && !$.isArray(doc)) {
        var firstValue = doc;
      } else {
        var firstValue = '';
      }
      this.props.onChange([{'$': firstValue},{'$': ''}]);
    } else {
      //add new item to array
      this.props.onChange(update(doc, {$push: [{'$': ''}]}));
    }
  },

  deleteDoc: function(index) {
    var doc = this.props.value;
    if($.isArray(doc) && doc.length > index) {
      this.props.onChange(update(doc, {$splice: [[index, 1]]}));
    }
  },

  closeDialogue: function(modalRef, evt) {
    this.refs[modalRef].toggleModal(evt);
  },

  doValidate: function() {
    var msgContainer = {message: null};
    var handleFeedback = function(msg) {
      msgContainer.message = msg;
    };
    var valid = Validation.validateDocumentation(this.props.value, handleFeedback);

    if(!valid) {
      log.debug("Invalid documentation:", msgContainer.message);
    }

    this.setValidation(valid, msgContainer.message);

    return valid;
  },

  render: function() {
    var {value, onChange, name, ...other} = this.props;
    var docs = ($.isArray(value) && value.length > 0) ? value : [null];

    var isInvalid = this.isValidated() && !this.isValid();

    return (
      <div>
      {
        docs.map(function(doc,index) {
          var languageCode = doc && doc['@lang'] || null;

          var modalRef = "modalTrigger" + index;
          var closeModal = this.closeDialogue.bind(this, modalRef);

          var languageInput = <ModalTrigger
            ref={modalRef}
            modalTarget="documentationLanguageModalContainer"
            label={languageCode || <Glyphicon glyph="comment"/>}
            onOpen={this.props.loadValueSchemeData}
            useLink={true}
            disabled={!this.isCmdi12Mode()}
            title={languageCode ? "Content language for this documentation item" : "Click to set the content language"}
            modal={
              <DocumentationLanguageModal
                languageCode={languageCode}
                onClose={closeModal}
                onChange={this.updateLanguageCode.bind(this, index)}
                />
            } />
          return <Input key={index} name={name + "-" + index} type="text" value={doc == null ? "" : doc['$']} {...other} onFocus={this.doValidate} onChange={this.updateValue.bind(this, index)}
            addonBefore={languageInput}
            addonAfter={index > 0 &&
              <a className="delete" onClick={this.deleteDoc.bind(this, index)}  title="Remove documentation item"><Glyphicon glyph="trash" /></a>
            }
            onBlur={this.doValidate}
            bsStyle={isInvalid ? "error":null}
            />
        }.bind(this))
      }
      {this.isCmdi12Mode() &&
        <div className="add-documentation-item" ><a onClick={this.addDoc} title="Create an additional documentation item">Add documentation <Glyphicon glyph="plus"/></a></div>
      }
      {isInvalid &&
        <Alert bsStyle="danger">{this.getValidationMessage() || "Invalid documentation (reason unknown)"}</Alert>
      }
      </div>
    );
  }
});

/**
 * DocumentationLanguageModal Modal with local state initialised on passed language code value and user triggered callback to pass currently entered value
 * @type {[type]}
 */
var DocumentationLanguageModal = React.createClass({
  propTypes: {
    languageCode: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    onClose: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    return {
      languageCode: this.props.languageCode
    }
  },

  onChange: function() {
    var code = this.state.languageCode;
    if(code != null && code.trim() == '') {
      this.props.onChange(null);
    } else {
      this.props.onChange(code);
    }
    this.props.onClose();
  },

  onUnset: function() {
    this.props.onChange(null);
    this.props.onClose();
  },

  setLanguageCode: function(evt) {
    this.setState({languageCode: evt.target.value});
  },

  render: function() {
    return (
      <Modal.Dialog ref="modal" id="documentation-language-dialogue" className="type-dialog" enforceFocus={true} backdrop={false}>

        <Modal.Header closeButton={true} onHide={this.props.onClose}>
          <Modal.Title>Documentation: language code</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>
            Language codes for documentation items should be compliant with the requirements for XML language tags.
            For more information, see W3C's article <a target="_blank" href="https://www.w3.org/International/articles/language-tags/">Language tags in HTML and XML</a>.
          </p>
          <Input type="select" value={this.state.languageCode} onChange={this.setLanguageCode} label="Select a language (incomplete list):">
            <option value="">...</option>
            {
              //generate languages options list
              //TODO(?): use https://github.com/mattcg/language-tags instead
              Object.keys(languageCodes).map(function(code){
                return <option key={code} value={code}>{languageCodes[code].name}</option>;
              })
            }
          </Input>
          <Input type="text" ref="languageCodeInput" value={this.state.languageCode || ""} label="or enter a language code:" labelClassName="editorFormLabel" wrapperClassName="editorFormField"
            onChange={this.setLanguageCode} />
        </Modal.Body>

        <Modal.Footer>
          <Button disabled={this.state.languageCode == null || this.state.languageCode === ''} onClick={this.onChange}>Ok</Button>
          <Button onClick={this.props.onClose}>Cancel</Button>
            {this.props.languageCode && <Button bsStyle="danger" onClick={this.onUnset}><Glyphicon glyph="remove" />Unset language code</Button>}
        </Modal.Footer>

      </Modal.Dialog>
    );
  }
});


module.exports = DocumentationInput;
