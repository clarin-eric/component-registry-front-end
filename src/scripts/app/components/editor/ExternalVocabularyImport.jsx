'use strict';
var log = require('loglevel');
var React = require('react');

//components
var VocabularyTable = require('./VocabularyTable');

//bootstrap
var Input = require('react-bootstrap/lib/Input');
var Modal = require('react-bootstrap/lib/Modal');
var Button = require('react-bootstrap/lib/Button');
var ProgressBar = require('react-bootstrap/lib/ProgressBar');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//utils
var ComponentRegistryClient = require('../../service/ComponentRegistryClient');
var classnames = require('classnames');
var update = require('react-addons-update');
var _ = require('lodash');

var ExternalVocabularyImport = React.createClass({

    mixins: [ImmutableRenderMixin],

    propTypes: {
      vocabularyUri: React.PropTypes.string.isRequired,
      valueProperty: React.PropTypes.string.isRequired,
      displayValueProperty: React.PropTypes.string,
      language: React.PropTypes.string,
      onSetVocabularyItems: React.PropTypes.func.isRequired,
      onClose: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        vocabularyUri: this.props.vocabularyUri,
        valueProperty: this.props.valueProperty,
        displayValueProperty: this.props.displayValueProperty,
        language: this.props.language,
        preview: false,
        progress: {}
      }
    },

    retrieveVocabItems: function() {
      var uri=this.state.vocabularyUri,
          valueProp=this.state.valueProperty,
          language=this.state.language,
          displayProp=this.state.displayValueProperty;
      if(!uri || !valueProp || uri === "" || valueProp === "") {
        this.setState({
          progress: {
            error: "Please specify a URI and value property"
          }
        });
      } else {
        log.debug("Retrieving vocabulary items for", uri, valueProp, language, displayProp);
        this.setState({
          progress: {
            started: true,
            itemsDownloaded: false,
            itemsCount: -1,
            itemsProcessed: 0
          }
        });
        ComponentRegistryClient.queryVocabularyItems(uri, [valueProp, displayProp], this.processRetrievedVocabItems.bind(this, uri, valueProp, language, displayProp),
          function(error) {
            this.setState({
              progress: {
                error: error
              }
            });
          }.bind(this)
        );
      }
    },

    processRetrievedVocabItems: function(uri, valueProp, language, displayProp, data) {
      log.debug("Retrieved vocabulary item", data);
      if(data.indexConcepts) {
        var concepts = data.indexConcepts;
      } else {
        var concepts = null;
      }


      //async state update and processing of retrieved items
      var deferProgress = $.Deferred();

      deferProgress.then(function() {
        this.setState({
          progress: {
            itemsDownloaded: true,
            itemsCount: concepts.length,
            done: false,
          }
        });
      }.bind(this));

      var deferItems = $.Deferred();
      deferProgress.then(this.transformVocabItems.bind(this, concepts, valueProp, language, displayProp, deferItems.resolve));

      deferItems.then(function(items) {
        log.debug("Items", items);
        var importState = update(this.state.progress, {$merge: {done: true, items: items}});
        this.setState({progress: importState});
      }.bind(this));

      //trigger processing
      deferProgress.resolve();
    },


    /**
     * Transforms the results of the vocabulary service into an array of CMD vocabulary items
     * @param  {array}   data      array of items each assumed to have an 'uri' property and a property matching the provided value property
     * @param  {string}   valueProp property to map the value to
     * @param  {string}   language  preferred language variant of the property (can be null)
     * @param  {Function} cb        optional callback, will be called with transformed items
     * @return {array}             Array of transformed items if no callback provided
     */
    transformVocabItems: function(data, valueProp, language, displayProp, cb) {
      log.debug("Map item data with", 'uri', valueProp, language, displayProp);

      var items = data.map(function(item, idx) {
        var conceptLink = item.uri;
        var value = this.attemptGetPropertyValue(item, valueProp, language);
        if(value == null) {
          //no value or fallback value is present, return null for the entire item
          log.warn("No value or fallback value for property {", valueProp, "} in item", item);
          return null;
        }

        var displayValue = displayProp != null && displayProp != '' && this.attemptGetPropertyValue(item, displayProp, language) || null;

        return {
          '$': value,
          '@ConceptLink': conceptLink,
          '@AppInfo': displayValue
        }
      }.bind(this));

      //strip out null values from items list!
      var rawLength = items.length;
      items = _.without(items, null);
      if(rawLength != items.length) {
        log.warn(rawLength - items.length, "items were omitted because no value was found!");
      }

      if(cb) {
        cb(items);
      } else {
        return items;
      }
    },

    /**
     * Tries to find a value for the specified value property, first trying to match the language; if not, without; if that fails, try any other languages, English first
     * @param  {[type]} item      property haystack
     * @param  {[type]} valueProp property needly
     * @param  {[type]} language  optional preferred language
     * @return {[type]}           value if found, otherwise null
     */
    attemptGetPropertyValue: function(item, valueProp, language) {
      if(language == null || language === '') {
        var valueProperty = valueProp;
      } else {
        var valueProperty = valueProp + '@' + language;
      }

      var value = item[valueProperty];
      if(value == null) {
        //try without language if not already tried
        if(language != null && item.hasOwnProperty(valueProp)) {
          value = item[valueProp];
          log.debug("Fallback to {", valueProp, "}, value", value);
        }
        //try english if not preferred language
        else if(language != 'en' && item.hasOwnProperty(valueProp + '@en')) {
          value = item[valueProp + '@en'];
          log.debug("Fallback to english {", valueProp, "}, value", value);
        }
        //try any other language
        else {
          log.debug("Looking for other versions of property {", valueProp, "} in", item);
          var otherLanguageKey = _.chain(item).keys().find(function(k) {
            return _.startsWith(k, valueProp + '@')
          }).value();
          if(otherLanguageKey != null) {
            value = item[otherLanguageKey];
            log.debug("Fallback to key", otherLanguageKey, "value", value);
          }
        }
      }
      return value;
    },

    applyVocabularyImport: function() {
      var items = this.state.progress.items;
      this.props.onSetVocabularyItems(items);
      this.props.onClose();
    },

    togglePreview: function() {
      this.setState({preview: !this.state.preview});
    },

    render: function() {
      var importState = this.state.progress;
      log.trace("Import state", importState);

      var active = !importState.done && !importState.error;

      if(importState.error) {
        var progressCount = 100;
        var style = "danger";
        var label = "Import failed";
      } else if(importState.done) {
        var progressCount = 100;
        var style = "success"
        var label = "Done";
      } else if(importState.itemsDownloaded) {
        var progressCount = 50;
        var style = "info";
        var label = "Processing items..."
      } else if(importState.started) {
        var progressCount = 25;
        var style = null;
        var label ="Getting items...";
      } else {
        var progressCount = 0;
        var style = null;
        var label = null;
      }

      var classes = classnames('external-vocabulary-import');
      return(
        <Modal.Dialog show={true} key="externalVocabModal" ref="modal" id="externalVocabModal" className="registry-dialog" enforceFocus={true} backdrop={false}>

          <Modal.Header closeButton={true} onHide={this.props.onClose}>
            <Modal.Title>Import external vocabulary</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className={classes}>

              <ProgressBar active={active} bsStyle={style} label={label} now={Math.floor(progressCount)} />
              {importState.error && <div className="error">{importState.error}</div>}
              {importState.done && this.renderResultDetails(importState)}

              <hr />

              <div className="external-vocabulary-import-properties">
                <Input type="text" label="Vocabulary:" value={this.state.vocabularyUri} onChange={function(e){this.setState({vocabularyUri: e.target.value})}.bind(this)} />
                <Input type="text" label="Value property:" value={this.state.valueProperty} onChange={function(e){this.setState({valueProperty: e.target.value})}.bind(this)} />
                <Input type="text" label="Value language:" value={this.state.language} onChange={function(e){this.setState({language: e.target.value})}.bind(this)} />
                <Input type="text" label="Display value property:" value={this.state.displayValueProperty} onChange={function(e){this.setState({displayValueProperty: e.target.value})}.bind(this)} />
              </div>

              <Button onClick={this.retrieveVocabItems}>(Re)load vocabulary</Button>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="modal-inline">
              <div className="external-vocabulary-search-buttons">
                <Button onClick={this.props.onClose}>Cancel</Button>
                <Button onClick={this.applyVocabularyImport} disabled={importState.error || !importState.done || importState.items.length === 0}>Import loaded items</Button>
              </div>
            </div>

          </Modal.Footer>
        </Modal.Dialog>
      );
    },

    renderResultDetails: function(importState) {
      var resultCount = importState.items.length;
      return (
        <div>
          Items loaded: {resultCount}
          {resultCount != importState.itemsCount && <div className="error"><Glyphicon glyph="warning-sign"/> {importState.itemsCount - resultCount} items were omitted because no matching value could be found for the specified property/properties!</div>}
          {resultCount > 0 && !this.state.preview &&
            <div>
              <a onClick={this.togglePreview}><Glyphicon glyph="eye-open"/> Show preview</a>
            </div>
          }
          {resultCount > 0 && this.state.preview &&
            <div>
              <a onClick={this.togglePreview}><Glyphicon glyph="eye-close"/> Hide preview</a>
              <div>{importState.items.length > 100 && <span>Showing first 100 items (not showing {importState.items.length - 100} additional items):</span>}
              <VocabularyTable items={_.slice(importState.items, 0, 100)} readOnly />
              </div>
            </div>
          }
        </div>
      );
    }

});

module.exports = ExternalVocabularyImport;
