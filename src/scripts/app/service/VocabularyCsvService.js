'use strict';
var log = require('loglevel');
var papaparse = require('papaparse');

var NEWLINE = "\r\n";
var DELIMITER = ',';

var VocabularyCsvService = {

  parseOptions: {
    delimiter: DELIMITER,
    skipEmptyLines: true
  },

  unparseOptions: {
    newline: NEWLINE,
    delimiter: DELIMITER
  },

  serializeItems: function(items) {
    log.debug("Serializing items to csv", items);

    var data = papaparse.unparse(
      {
        fields: ['$', '@AppInfo', '@ConceptLink'],
        data: items
      }, this.unparseOptions
    );

    //remove first line (header)
    data = _(data)
        .split(NEWLINE)
        .tail()
        .join(NEWLINE);

    log.debug("Serialized items:", data);
    return data;
  },

  deserializeItems: function(csvData) {
    log.debug("Deserializing items from csv: ", csvData);
    var result = papaparse.parse(csvData, this.parseOptions);
    log.debug("Parse result", result);

    if(result.errors.length > 0) {
      throw result.errors;
    } else {
      //map results (array of arrays) to desired array of item objects
      var items = result.data.map(function (item) {
        return {
          '$': item[0],
          '@AppInfo': item[1],
          '@ConceptLink': item[2]
        };
      });
      log.debug("Deserialized items", items);
      return items;
    }
  }
}

module.exports = VocabularyCsvService;
