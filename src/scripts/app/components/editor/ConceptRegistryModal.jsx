'use strict';
var log = require('loglevel');
var _ = require('lodash');

var React = require('react');
var ReactDOM = require('react-dom');
var Table = require('reactabular').Table;
var select = require('selectabular');
var byArrowKeys = require('reactabular-select').byArrowKeys;
var sortColumn = require('reactabular').sortColumn;


//mixins
var LinkedStateMixin = require('react-addons-linked-state-mixin');

//bootstrap
var Modal = require('react-bootstrap/lib/Modal');
var Input = require('react-bootstrap/lib/Input');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');
var Button = require('react-bootstrap/lib/Button');

//utils
var ComponentRegistryClient = require('../../service/ComponentRegistryClient');
var update = require('react-addons-update');
var classNames = require('classnames');

var CONCEPT_IDENTIFIER_PROPERTY = '@id';

require('../../../../styles/EditorDialog.sass');
/**
* ConceptRegistryModal - Bootstrap Modal dialog for setting the Concept Registry (CCR) link.
* @constructor
* @mixes require('react-addons-linked-state-mixin')
*/
var ConceptRegistryModal = React.createClass({
  mixins: [LinkedStateMixin],

  propTypes: {
    onSelect: React.PropTypes.func.isRequired,
    container: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    return {
      rows: [],
      columns: [],
      inputSearch: "",
      helpShown: false,
      queryError: null,
      queryDone: false,
      selectedRow: {}
    }
  },

  getDefaultProps: function() {
    return {
      title: "Search in CLARIN Concept Registry",
      show: true
    };
  },

  componentWillUnmount: function() {
    $(document.body).off('keydown', this.handleEnter);
  },

  componentWillMount: function() {
    $(document.body).on('keydown', this.handleEnter);

    this.setState({ columns: this.getColumnsDefinition()});
  },

  render: function() {
    var self = this;
    var tableClasses = classNames('table', 'table-bordered', 'table-hover', 'table-striped', 'table-condensed');
    var conceptRegHeader = {
      onClick: function(col) {
        sortColumn(self.state.columns, col, self.state.rows, self.setState.bind(self));
      }
    };

    var rows = this.state.rows;
    var selectedRowIndex = this.getSelectedRowIndex(this.state.selectedRow);
    var onRow = this.onRow;

    return byArrowKeys({
          rows: this.state.rows,
          selectedRowIndex: selectedRowIndex,
          onSelectRow: this.onSelectRow
        })(
      <Modal.Dialog show={this.props.show} key="ccrModal" ref="modal" id="ccrModal" className="registry-dialog" enforceFocus={true} backdrop={false}>

        <Modal.Header closeButton={true} onHide={this.close}>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Input
            type="text" placeholder="Type keyword (at least 2 characters) and press Enter to search"
            valueLink={this.linkState('inputSearch')}
            addonBefore={<Glyphicon glyph='search' />}
            buttonAfter={
              <Button onClick={this.inputSearchUpdate} disabled={this.state.inputSearch.length <= 1}>Search</Button>
            }
            />
          {this.state.queryDone && this.state.rows != null && <div>
            {this.state.rows.length} results:
          </div>}
          {this.state.queryError != null && <div class='error'>
            {this.state.queryError}
          </div>}
          {/*<Table   data={this.state.rows} header={conceptRegHeader}  />*/}
          <Table.Provider id="ccrTable" ref="table" className={tableClasses} columns={this.state.columns}>
            <Table.Header />
            <Table.Body rows={this.state.rows} rowKey={CONCEPT_IDENTIFIER_PROPERTY} onRow={onRow} />
          </Table.Provider>
          <a onClick={this.toggleHelp}><Glyphicon glyph='question-sign' /></a>
          {this.state.helpShown &&
            <div>
              <p>Hover the mouse over the search results to see full labels. Click the PersistentId to go to the concept's entry in the concept registry</p>
              <p>You can use wildcards, parentheses and the special keywords 'AND', 'OR' and 'NOT' in your query as well as the '-' prefix to exclude terms. <br />
              Some examples of valid queries:</p>
              <ul>
                <li>convers*</li>
                <li>person AND name</li>
                <li>subject OR topic</li>
                <li>language AND (code OR name)</li>
                <li>language NOT (code OR name)</li>
                <li>language -code</li>
              </ul>
              <p>Click the 'Clear setting' button to unset the current concept for the current component, element or attribute.</p>
            </div>
        }
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={this.confirm} disabled={this.state.selectedRow[CONCEPT_IDENTIFIER_PROPERTY] == null}>Ok</Button>
          <Button onClick={this.clear}>Clear Setting</Button>
          <Button onClick={this.close}>Cancel</Button>
        </Modal.Footer>
      </Modal.Dialog>
    );
  },

  /*=== Event handlers ====*/

  inputSearchUpdate: function(evt) {
    log.debug('search query: ' + this.state.inputSearch);
    var self = this;
    this.setState({ rows: [], selectedRow: {} });
    ComponentRegistryClient.queryCCR(this.state.inputSearch, function(data) {
      if(data != null) {
        var indexedData =
          _.map(data, function(row ,index) {
            return _.merge(row, {index: index});
          });
        log.debug("CCR response", indexedData);
        self.setState({ rows: indexedData, queryDone: true, queryError: null });
      } else {
        self.setState({rows: null, queryError: "Failed to query concept registry"})
        log.error("Failed to query CCR");
      }
    });
  },

  toggleHelp: function(evt) {
    this.setState({helpShown: !this.state.helpShown});
  },

  handleEnter: function(evt) {
    if(evt.keyCode == 13) {
      log.debug('enter: ' + this.state.inputSearch);
      this.inputSearchUpdate();
    }
  },

  confirm: function(evt) {
    var selectedValue = this.state.selectedRow[CONCEPT_IDENTIFIER_PROPERTY] || "";
    this.assignValue(selectedValue);
    this.close();
  },

  clear: function(evt) {
    this.assignValue("");
    this.close();
  },

  close: function(evt) {
    this.props.onClose(evt);
  },

  assignValue: function(value) {
    this.props.onSelect(value);
  },

  /*=== Table definition ====*/

  getColumnsDefinition: function() {
    return [
      {
        property: 'http://www.w3.org/2004/02/skos/core#prefLabel',
        header: {label: 'Name'},
        cell: {format: this.handleCellWithTooltip}
      },
      {
        property: 'definition',
        header: {label: 'Definition'},
        cell: {format: this.handleCellWithTooltip}
      },
      {
        property: '@id',
        header: {label:  'Identifier'},
        cell: {format: this.handleCellWithTooltip}
      // },
      // {
      //   property: 'owner',
      //   header: {label: 'Owner'},
      //   cell: {format: this.handleCell}
      },
      {
        property: '@id',
        header: {label: 'PersistentId'},
        cell: {format: this.handlePidLink}
      // },
      // {
      //   property: 'type',
      //   header: {label: 'Type'},
      //   cell: {format: this.handleCell}
      // },
      // {
      //   property: 'version',
      //   header: {label: 'Version'},
      //   cell: {format: this.handleCell}
      }
    ];
  },

  cellSelectTransform: function(value, extras) {
    return {
      onClick: this.handleCellSelect.bind(this, extras.rowIndex)
    }
  },

  handleCellWithTooltip: function(value, extras) {
    return (<span title={value}>{value}</span>
    );
  },

  handleCell: function(value, extras) {
    return (<span>{value}</span>);
  },

  handlePidLink: function(value, extras) {
    if(value == null) {
      return "";
    } else {
      return (<span
        ><a title={value} href={value} target="_blank">{
        value.replace(new RegExp("^https?:\/\/hdl.handle.net\/([0-9]+\/)?"), "") //TODO: REGEX?
      }</a></span>);
    }
  },

  onRow(row, extras) {
    log.trace("On row ", row, "extras: ", extras);
    var selectedRow = this.state.selectedRow;
    return {
      className: classNames(
        extras.rowIndex % 2 ? 'odd' : 'even',
        {
          'selected-row': (selectedRow[CONCEPT_IDENTIFIER_PROPERTY] && 
            row[CONCEPT_IDENTIFIER_PROPERTY] === selectedRow[CONCEPT_IDENTIFIER_PROPERTY])
        }
      ),
      onClick: function(){this.onSelectRow(extras.rowIndex)}.bind(this)
    };
  },

  onSelectRow(selectedRowIndex) {
    const filter = (row => row.index == selectedRowIndex);

    //single selection so use all unselected rows as base
    const rows = select.none(this.state.rows);
    const selectionResult = select.rows(filter)(rows);

    //single selection, so take head (there _should_ be exactly one item anyway)
    const selectedRow = _.head(selectionResult.selectedRows);

    if(selectedRow === undefined) {
      log.error("Empty selection result on select row: ", selectedRows);
    } else {
      log.debug("Selected row", selectedRow);
      this.setState({
        //new rows list, only previous and new selection should have changed and thus updated
        rows: selectionResult.rows,
        //(first) selected item
        selectedRow: selectedRow
      });
    }
  },

  getSelectedRowIndex(selectedRow) {
    if(selectedRow == null) {
      return -1;
    } else {
      return selectedRow.index;
    }
  }
});

module.exports = ConceptRegistryModal;
