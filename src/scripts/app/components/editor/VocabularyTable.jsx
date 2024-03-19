'use strict';
var log = require('loglevel');

var React = require('react');

//components
var ModalTrigger = require('../ModalTrigger');
var ConceptRegistryModal = require('./ConceptRegistryModal');
var ValidatingTextInput = require('./ValidatingTextInput');
var Table = require('reactabular').Table;
var sortColumn = require('reactabular').sortColumn;

//service
var Validation = require('../../service/Validation')

//bootstrap
var Glyphicon = require('react-bootstrap/lib/Glyphicon');
var Button = require('react-bootstrap/lib/Button');

//mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

//utils
var _ = require('lodash');
var edit = require('react-edit');
var cloneDeep = require('lodash/cloneDeep');
var findIndex = require('lodash/findIndex');

var TABKEY = 9;


var VocabularyTable = React.createClass({
  mixins: [ImmutableRenderMixin],

  propTypes: {
    items: React.PropTypes.array.isRequired,
    addConceptLink: React.PropTypes.func,
    removeConceptLink: React.PropTypes.func,
    onRemoveVocabularyItem: React.PropTypes.func,
    onVocabularyPropertyChange: React.PropTypes.func,
    addRow: React.PropTypes.func,
    readOnly: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      readOnly: false
    };
  },

  getInitialState: function () {
    return {
      editedRow: -1,
      editedColumn: -1,
      editConceptLink: -1
    }
  },

  componentDidMount: function () {
    fixVocabTableColumnSizes();
  },

  componentDidUpdate: function (prevProps, prevState) {
    var vocab = this.props.items;
    var prevVocab = prevProps.items;

    if (vocab !== prevVocab) {
      //in case number of items affect scrollbar visibility
      fixVocabTableColumnSizes();

      if ($.isArray(vocab)) {
        if (prevVocab == null || vocab.length > prevVocab.length) {
          //scroll to bottom
          var tableBody = $('table#typeTable tbody');
          var height = tableBody.prop("scrollHeight");
          log.debug("table height", height);
          tableBody.animate({ scrollTop: height }, "slow");

          this.setState({
            editedRow: vocab.length - 1,
            editedColumn: 0
          });
        }
      }
    }
  },

  render: function () {
    var vocabData = this.props.items;
    if (!$.isArray(vocabData)) {
      // single item, wrap
      vocabData = [vocabData];
    }
    vocabData = vocabData.map(function (val, idx) {
      val.rowIdx = idx;
      return val;
    });
    log.trace("Table data:", vocabData);

    return (
      <Table.Provider id="typeTable" ref="table" className="table table-condensed" columns={this.getColumns()}>
        <Table.Header />
        <Table.Body rows={vocabData} rowKey="rowIdx" />
      </Table.Provider>
    );
  },

  handleTab: function (evt) {
    evt.preventDefault();
    var shift = evt.shiftKey;

    var rows = this.props.items.length, columns = 2;
    var row = this.state.editedRow, col = this.state.editedColumn;

    if (col == 0) {
      var targetCol = 1;
      var targetRow = shift ? row - 1 : row;
    } else if (col == 1) {
      var targetCol = 0;
      var targetRow = shift ? row : row + 1;
    }

    if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < columns) {
      evt.target.blur();
      this.setState({
        editedRow: targetRow,
        editedColumn: targetCol
      });
    }
  },

  handleEnter: function (evt) {
    var rows = this.props.items.length, columns = 2;
    var row = this.state.editedRow, col = this.state.editedColumn;

    if (col === 1 && !evt.shiftKey) {
      //if in the last row...
      if (row === rows - 1) {
        if (this.props.addRow) {
          //add a row
          evt.preventDefault();
          $(evt.target).blur(function () {
            this.props.addRow();
          }.bind(this));
        }
      } else {
        //go to next row
        var targetRow = this.state.editedRow + 1;
        $(evt.target).blur(function () {
          this.setState({ editedRow: targetRow, editedColumn: 0 });
        }.bind(this));
      }
    }
  },

  getColumns: function () {
    var self = this;
    var editable = edit.edit({
      // Determine whether the current cell is being edited or not.
      isEditing: function (props) {
        return props.columnIndex === self.state.editedColumn && props.rowData.rowIdx === self.state.editedRow
      },

      // The user requested activation...
      onActivate: function (props) {
        log.trace("activate", props.columnIndex, props.rowData);
        self.setState({
          editedRow: props.rowData.rowIdx,
          editedColumn: props.columnIndex
        });
      },

      // Capture the value when the user has finished, propagate change
      onValue: function (props) {
        log.debug("value '", props.value, "' for", props.property, "of", props.rowData);

        var value = props.value;
        if (props.property === '$' || props.property === '@AppInfo') {
          if (value == null) {
            value = ""; //make sure to always set a value
          }
        }

        self.props.onVocabularyPropertyChange(props.rowData.rowIdx, props.property, value);

        //unset edited cell
        self.setState({
          editedRow: -1,
          editedColumn: -1
        });
      }
    });

    var highlightEdited = function (value, extras) {
      if (extras.rowIndex === self.state.editedRow && extras.columnIndex === self.state.editedColumn) {
        return {
          className: "cell-selected"
        };
      }
    };

    return [
      {
        property: '$',
        header: { label: 'Value' },
        cell: this.props.readOnly ? {} : {
          transforms: [editable(edit.input({
            props: {
              onKeyDown: handleKeyCodes({
                  /*TAB*/ 9: self.handleTab
              })
            }
          })), highlightEdited]
        }
      }, {
        /* Description column */
        property: '@AppInfo',
        header: { label: 'Description' },
        cell: this.props.readOnly ? {} : {
          transforms: [editable(edit.input({
            props: {
              onKeyDown: handleKeyCodes({
                  /*TAB*/ 9: self.handleTab,
                  /*ENTER*/ 13: self.handleEnter
              })
            }
          })), highlightEdited]
        }
      }, {
        /* Concept link column */
        property: '@ConceptLink',
        header: { label: 'Concept link' },
        cell: {
          format: this.renderConceptLinkColumn
        }
      },
      {
        /* nameless column with a delete button for each row */
        cell: {
          format: function (value, extra) {
            if (!self.props.readOnly && self.props.onRemoveVocabularyItem) {
              return (<Glyphicon
                glyph="trash"
                style={{ cursor: 'pointer' }}
                title="Remove item"
                onClick={self.props.onRemoveVocabularyItem.bind(null, extra.rowIndex)} />);
            } else {
              return "";
            }
          }
        }
      }
    ];
  },

  updateConceptLink: function(rowIndex, e) {
    return this.props.addConceptLink(rowIndex, e.target.value);
  },

  renderConceptLinkColumn: function (value, extra) {
    if (this.state.editConceptLink === extra.rowIndex) {
      // edit mode is enabled for current row
      const disabled = this.props.readOnly || !this.props.addConceptLink;
      return (
        <ValidatingTextInput type="text" name="URI" defaultValue={value} disabled={disabled}
          onChange={this.updateConceptLink.bind(null, extra.rowIndex)}
          validate={Validation.checkConceptLink}
          addonAfter={
            <Glyphicon
              glyph="pencil"
              style={{ cursor: 'pointer' }}
              title="Stop editing"
              onClick={() => {
                //disable edit mdoe
                this.setState({ editConceptLink: -1 });
              }}
            />
          }
        />
      );
    } else { // edit mode IS NOT enabled for current row
      const enableEditMode = function() {
        // enable edit mode for this row
        this.setState({ editConceptLink: extra.rowIndex });
      }.bind(this);

      var modalRef;
      var closeHandler = function (evt) {
        modalRef.toggleModal();
      }
      if (!this.props.readOnly && this.props.addConceptLink) {
        var modal = (
          <ModalTrigger
            ref={function (modal) {
              modalRef = modal;
            }}
            modalTarget="ccrModalContainer"
            label="add concept link"
            bsStyle="primary"
            modal={
              <ConceptRegistryModal
                onClose={closeHandler}
                onSelect={this.props.addConceptLink.bind(null, extra.rowIndex)}
                container={this} />
            } />
        );
      }

      if (value && value != "") {
        return (
          <span>
            <a href={value} target="_blank">{value}</a> &nbsp;
            <Glyphicon
              glyph="pencil"
              style={{ cursor: 'pointer' }}
              title="Remove item"
              onClick={enableEditMode} />
            {!this.props.readOnly && this.props.removeConceptLink &&
              <a onClick={this.props.removeConceptLink.bind(null, extra.rowIndex)} style={{ cursor: 'pointer' }}>&#10007;</a>}
          </span>);
      } else {
        return (<span>{modal}
          <Button onClick={enableEditMode}  title="Edit identifier">
            <Glyphicon
              glyph="pencil"
              style={{ cursor: 'pointer' }} />
          </Button>
        </span>);
      }
      return <span>click</span>
    }
  }

});

module.exports = VocabularyTable;

function fixVocabTableColumnSizes() {
  // Change the selector if needed
  var $table = $('table#typeTable'),
    $bodyCells = $table.find('tbody tr:first').children(),
    colWidth;

  if ($bodyCells && $bodyCells.length > 0) {
    // Get the tbody columns width array
    colWidth = $bodyCells.map(function () {
      return $(this).width();
    }).get();

    // Set the width of thead columns
    $table.find('thead tr').children().each(function (i, v) {
      $(v).width(colWidth[i]);
    });
  }
}

//creates a function that handles a keydown effect for a specific key code
function handleKeyCodes(codeHandlers) {
  return function (evt) {
    _.forIn(codeHandlers, function (value, key) {
      log.trace("Check", evt.keyCode, "against", key);
      //key = keycode
      //value = handler
      if (evt.keyCode == key) {
        log.trace("Matching handler found for", key, value);
        value(evt);
      }
    });
  };
};
