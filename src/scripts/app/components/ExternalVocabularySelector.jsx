'use strict';
var log = require('loglevel');
var React = require('react');

var VOCABULARY_TITLE_PROPERTY='http://purl.org/dc/terms/title';

//bootstrap
var Modal = require('react-bootstrap/lib/Modal');
var Button = require('react-bootstrap/lib/Button');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//utils
var ComponentRegistryClient = require('../service/ComponentRegistryClient');
var classnames = require('classnames');
var getConfiguration = require('../../config');

var ExternalVocabularySelector = React.createClass({

    mixins: [ImmutableRenderMixin],

    propTypes: {
      onSelect: React.PropTypes.func.isRequired,
      onClose: React.PropTypes.func.isRequired,
      initialSelectionUri: React.PropTypes.string
    },

    getInitialState: function() {
      return {
        loading: false,
        vocabularies: [],
        error: null,
        selected: null
      }
    },

    componentDidMount: function() {
      this.doQuery();
    },

    doQuery: function() {
      this.setState({
        loading: true,
        error: null}
      );
      ComponentRegistryClient.queryVocabularies(function(vocabularies) {
        if(vocabularies == null) {
          this.setState({
            loading: false,
            error: "Failed to retrieve vocabularies"
          });
        }
        log.debug("Retrieved vocabularies", vocabularies);

        var selected = this.state.selected;
        if(selected == null && this.props.initialSelectionUri != null) {
          log.debug("Initial selection:", this.props.initialSelectionUri);
          var targetUri = this.props.initialSelectionUri;
          for(var i=0;i<vocabularies.length;i++) {
            if(vocabularies[i]['@id'] === targetUri) {
              selected = vocabularies[i];
            }
          }
        }
        this.setState({
          loading: false,
          vocabularies: vocabularies,
          selected: selected
        });
      }.bind(this));
    },

    selectItem: function(item) {
      if(this.state.selected && this.state.selected['@id'] === item['@id']) {
        //unselect
        this.setState({selected: null});
      } else {
        this.setState({selected: item});
      }
    },

    submitSelection: function(item) {
      this.props.onSelect(this.state.selected['@id'], 'http://www.w3.org/2004/02/skos/core#prefLabel', 'en');
      this.props.onClose();
    },

    render: function() {
      var classes = classnames('external-vocabulary-search', {
        loading: this.state.loading
      });

    return(
      <Modal.Dialog show={true} key="externalVocabModal" ref="modal" id="externalVocabModal" className="registry-dialog" enforceFocus={true} backdrop={false}>

        <Modal.Header closeButton={true} onHide={this.props.onClose}>
          <Modal.Title>Available external vocabularies</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={classes}>
            <div>
              {this.state.loading && <strong>Retrieving vocabularies...</strong>}
              {this.state.error && <div className="error">{this.state.error}<br /><a onClick={this.doQuery}>Try again</a></div>}
            </div>
            <div className="external-vocabulary-items">
              {!this.state.loading && this.state.vocabularies.length == 0 && <strong>No vocabularies found</strong>}
              {this.state.vocabularies.map(function(item, idx){
                var vocabId = item['@id'];
                var title =  null;
                var labels = item[VOCABULARY_TITLE_PROPERTY]
                if(labels) {
                  for(var i=0; i < labels.length; i++) {
                    var label = labels[i];
                    // take first label but prefer english label
                    if(label['@value'] && (title === null || label['@language'] == 'en')) {
                      title = label['@value'];
                    }
                  }
                }
                title = title || 'No title';
                var description = item['description@en'] || '';
                var vocabPageUrl = getConfiguration().vocabularyPageUrl + '?uri=' + vocabId;
                var itemClasses = classnames('external-vocabulary-item', {
                  selected: this.state.selected && this.state.selected['@id'] === item['@id']
                });
                return (
                  <div onClick={this.selectItem.bind(null, item)} className={itemClasses} key={idx}>
                    <div className="title">{title} <a href={vocabPageUrl} target="_blank"><Glyphicon glyph="info-sign" /></a></div>
                    {description &&
                      <div className="description">{description}</div>
                    }
                  </div>);
              }.bind(this))}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="external-vocabulary-search-buttons modal-inline">
            <Button onClick={this.submitSelection} disabled={this.state.selected == null}>Select</Button>&nbsp;
            <Button onClick={this.props.onClose}>Cancel</Button>
          </div>
        </Modal.Footer>
      </Modal.Dialog>
    );
    }

});

module.exports = ExternalVocabularySelector;
