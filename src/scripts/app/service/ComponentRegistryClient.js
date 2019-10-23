var clone = require('clone');

var log = require('loglevel');
var _ = require('lodash');

//JSONIX
var Jsonix = require('jsonix');
var CMD = require('../../../mappings/Component').Component;
var jsonixOptions = require('../../../mappings/jsonixOptions');
var context = new Jsonix.Context([CMD], jsonixOptions);
var marshaller = context.createMarshaller();

var Constants = require("../constants");
var getConfiguration = require('../../config');

var Validation = require('./Validation');

var ComponentSpec = require('../service/ComponentSpec');

var PROFILES_PATH = "profiles";
var COMPONENTS_PATH = "components";
var REGISTRY_ROOT = "/registry/1.x";
var REGISTRY_ROOT_CMDI_1_1 = "/registry/1.1";

var corsRequestParams = function() {
  return (getConfiguration().Config.cors) ?
    { username: getConfiguration().Config.REST.auth.username,
      password: getConfiguration().Config.REST.auth.password,
      xhrFields: {
        withCredentials: true
    }} : {};
}

var ComponentRegistryClient = {

  getRegistryUrl: function(type, id, version) {
    var root;

    if(version == null || version === Constants.CMD_VERSION_1_2) {
      root = REGISTRY_ROOT; //is canonical
    } else if(version === Constants.CMD_VERSION_1_1) {
      root = REGISTRY_ROOT_CMDI_1_1;
    } else {
      log.warn("Unknown CMDI version", version, " - assuming canonical");
      root = REGISTRY_ROOT;
    }
    var typepath = root + "/" + ((type === Constants.TYPE_PROFILE)?PROFILES_PATH:COMPONENTS_PATH);
    var requestUrl = getConfiguration().restUrl + typepath;
    if(id == null) {
      return requestUrl;
    } else {
      return requestUrl + "/" + id;
    }
  },

  getRegistrySpacePath: function(space) {
    if(space == Constants.SPACE_PUBLISHED) {
      return "published";
    }
    if(space == Constants.SPACE_PRIVATE) {
      return "private";
    }
    if(space == Constants.SPACE_TEAM) {
      return "group";
    }
  },

  loadComponents: function(type, space, group, statusFilter, handleSuccess, handleFailure) {
    var requestUrl = this.getRegistryUrl(type);

    var registrySpace = (space != null) ? this.getRegistrySpacePath(space): "";
    var teamId = (space == Constants.SPACE_TEAM) ? group : null;

    var reqData = { unique: new Date().getTime(), registrySpace: registrySpace, groupId: teamId, status: statusFilter };
    log.trace("Request: ", requestUrl, reqData);

    $.ajax($.extend({
     url: requestUrl,
     accepts: {
       json: 'application/json'
     },
     data: reqData,
     traditional: true, //to use param name 'status' rather than 'status[]'
     dataType: 'json',
     success: function(data) {
       log.trace("Successfully loaded ", requestUrl, "with", reqData);
       var _data = data;
       if(_data != null && _data != 'null') {
          if(_data.hasOwnProperty("componentDescription") && type == Constants.TYPE_COMPONENT)
            _data = data.componentDescription;
          else if(_data.hasOwnProperty("profileDescription") && type == Constants.TYPE_PROFILE)
            _data = data.profileDescription;

          if(!$.isArray(_data)) {
            _data = [_data];
          }

          _data = _data.map(function(item){
            //comments count is provided as string, better (e.g. for sorting) to turn into integer
            if(item.commentsCount) {
              item.commentsCount = parseInt(item.commentsCount);
            }
            return item;
          });

          handleSuccess(_data);
        } else {
          log.debug("Empty response from", requestUrl);
          //nothing was returned, empty workspace
          handleSuccess([]);
        }
     }.bind(this),
     error: function(xhr, status, err) {
       handleFailure("Error loading data from " + requestUrl + ": " + err);
     }.bind(this)
   }, corsRequestParams()));
 },

 loadSpec: function(type, id, raw_type, handleSuccess, handleFailure) {
  var self = this;
  var requestUrl = this.getRegistryUrl(type, id);
  $.ajax($.extend({
    url: requestUrl,
    dataType: (raw_type != undefined) ? raw_type : "json",
    success: function(data) {
      log.trace("Successfully loaded ", requestUrl);

      var normalised = self.normaliseSpec(data);
      log.trace("Data:", data, "Normalised:", normalised);

      handleSuccess(normalised);
    }.bind(this),
    error: function(xhr, status, err) {
      handleFailure("Error loading spec for " + id + ": " + err);
    }.bind(this)
  }, corsRequestParams()));
},

loadItem: function(id, handleSuccess, handleFailure) {
  var requestUrl = getConfiguration().restUrl + "/items/" + id;
  $.ajax($.extend({
    url: requestUrl,
    dataType: "json",
    success: function(data) {
      log.trace("Successfully loaded ", requestUrl);
      handleSuccess(data);
    }.bind(this),
    error: function(xhr, status, err) {
      handleFailure("Error loading item information for " + id + ": " + err);
    }.bind(this)
  }, corsRequestParams()));
},

saveComponent: function(spec, item, profileId, update, publish, handleSuccess, handleFailure) {
  var actionType = (publish) ? "publish" : "update";
  var registry = item;

  log.debug('Data to save: ', spec, item);

  var data = Validation.validate(spec);

  if(data.errors != undefined) {
    log.debug("Validation failed:", data);
    var message = "Invalid specification:";
    for(i=0; i < data.errors.length; i++) {
      message += "\n" + data.errors[i].message;
    }
    return handleFailure(message, data); // return invalid
  }

  var cmd_schema_xml;
  try {
    cmd_schema_xml = marshaller.marshalString({ name: new Jsonix.XML.QName('ComponentSpec'), value: data });
    log.debug('cmd schema: ', cmd_schema_xml);
  } catch(e) {
    log.error("Failed to marshal spec", data, e);
    handleFailure(e);
    return;
  }

  var fd = new FormData();
  fd.append('profileId', profileId);
  fd.append('name', data.Header.Name);
  fd.append('description', data.Header.Description);
  fd.append('group', (item.groupName != undefined || item.groupName != null) ? item.groupName : "");
  fd.append('domainName', item.domainName);
  fd.append('data', new Blob([ cmd_schema_xml ], { type: "application/xml" }));

  var typeSpace = ComponentSpec.isProfile(spec) ? PROFILES_PATH : COMPONENTS_PATH;
  var url = getConfiguration().restUrl + REGISTRY_ROOT + "/" + typeSpace;
  if(update) url += '/' + profileId + '/' + actionType;

  log.debug("POSTing to ", url);

  $.ajax($.extend({
      type: 'POST',
      url: url,
      data: fd,
      mimeType: 'multipart/form-data',
      processData: false,
      contentType: false,
      dataType: "json",
      success: function(data) {
        //check response...

        if(data['@registered'] == "false") {
          log.error("Failed registration", data);
          if(data.errors != undefined) {
            handleFailure(data.errors.error);
          } else {
            handleFailure("Unknown error while registering component");
          }
        } else if(handleSuccess) {
          handleSuccess(data);
        }
      }.bind(this),
      error: function(xhr, status, err) {
        handleFailure("Error saving spec: " + err, data);
      }.bind(this)
    }, corsRequestParams()));
},

/**
 * Turns all Component and Element properties into arrays
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
normaliseSpec: function(data) {
  if (typeof data != 'object') {
    return data;
  }

  //var rootComponent = (data.Header != undefined) ? data.Component : data;
  if (data.Header != undefined) {
    //root component
    data.Component = this.normaliseSpec(data.Component);
  } else {
    if(data.hasOwnProperty("@ComponentRef") && (data.Element || data.Component || data.AttributeList)) {
      log.debug("Encountered component children despite component id (", data["@ComponentRef"], ")");
      //linked component - strip children
      delete data.Element;
      delete data.Component;
      delete data.AttributeList
    } else {
      log.trace("normalising", data);
      var childElems = data.Element;
      var childComps = data.Component;

      //normalise 'Documentation' element (must be an array)
      data.Documentation = this.normaliseDocumentation(data.Documentation);

      if(childElems != undefined && childElems != null) {
        //if Element child(ren) exist, make sure it is an array
        var elemsArray;
        if($.isArray(childElems)) {
          elemsArray = childElems;
        } else {
          elemsArray = [childElems];
        }

        // normalise element children (attributes) and value scheme
        for(i=0; i<elemsArray.length; i++) {
          this.normaliseAttributeList(elemsArray[i].AttributeList);
          this.normaliseValueScheme(elemsArray[i].ValueScheme);
          //normalise 'Documentation' element (must be an array supporting attributes)
          elemsArray[i].Documentation = this.normaliseDocumentation(elemsArray[i].Documentation);
          //normalise 'AutoValue' element (must be an simple string array)
          elemsArray[i].AutoValue = this.normaliseAutoValue(elemsArray[i].AutoValue);
        }
        data.Element = elemsArray;
      }

      // normalise attributes of this component
      this.normaliseAttributeList(data.AttributeList);

      //if Component child(ren) exist, make sure it is an array
      if(childComps != undefined && childComps != null) {
        if(!$.isArray(childComps)) {
          childComps = [childComps];
        }

        // normalise children
        var self = this;
        data.Component = childComps.map(function(comp, index) {
          return self.normaliseSpec(comp);
        });
      }
    }
  }

  return data;
},

normaliseAttributeList: function(attrList) {
  if(attrList != null) {
    log.trace("Normalise attribute list", attrList);

    //if AttributeList.Attribute exist, make sure it is an array
    var attr = attrList.Attribute;
    if(attr != undefined) {
      var attrArray;
      if ($.isArray(attr)) {
        attrArray = attr;
      } else {
        attrArray = [attr];
      }

      // normalise all value schemes in the attributes
      for(j=0; j<attrArray.length; j++) {
        this.normaliseValueScheme(attrArray[j].ValueScheme);
        //normalise 'Documentation' element (must be an array supporting attributes)
        attrArray[j].Documentation = this.normaliseDocumentation(attrArray[j].Documentation);
        //normalise 'AutoValue' element (must be an simple string array)
        attrArray[j].AutoValue = this.normaliseAutoValue(attrArray[j].AutoValue);
      }

      attrList.Attribute = attrArray;
    }
  }
},

normaliseValueScheme: function(valueScheme) {
  if(valueScheme != null) {
    log.trace("Normalise valueScheme", valueScheme);
    var vocab = valueScheme.Vocabulary;
    if(vocab != null && vocab.enumeration != null) {
      var item = vocab.enumeration.item;
      if(item != undefined && !$.isArray(item)) {
        vocab.enumeration.item = [item];
      }
      vocab.enumeration.item = vocab.enumeration.item.map(function(item) {
        if(!$.isPlainObject(item)) {
          return {'$': item};
        } else {
          return item;
        }
      });
    }
  }
},

normaliseDocumentation: function(documentation) {
  log.trace("Documentation: ", documentation);
  if(documentation == null) {
    return documentation;
  } else if($.isArray(documentation)) {
    return documentation.map(function(doc) {
      if(!$.isPlainObject(doc)) {
        return {'$': doc};
      } else {
        return doc;
      }
    });
  } else if(typeof documentation == 'string') {
    log.trace("Turned into array", documentation);
    return [{'$': documentation}];
  } else {
    return [documentation];
  }
},

normaliseAutoValue: function(autoValue) {
  log.trace("AutoValue: ", autoValue);
  if(autoValue == null || $.isArray(autoValue)) {
    return autoValue;
  } else {
    log.trace("Turned into array", autoValue);
    return [autoValue];
  }
},

deleteComponent: function(type, itemId, handleSuccess, handleFailure) {
  var requestUrl = ComponentRegistryClient.getRegistryUrl(type, itemId);

  $.ajax($.extend({
    type: 'DELETE',
    url: requestUrl,
    success: function(data) {
      handleSuccess(data);
    },
    error: function(xhr, status, err) {
      handleFailure(err);
    }
  }, corsRequestParams()));
},

transferComponent: function(itemId, teamId, handleSuccess, handleFailure) {
  var url = getConfiguration().restUrl + '/items/' + itemId + '/transferownership?groupId=' + teamId;
  $.ajax($.extend({
    type: 'POST',
    data: {groupId: teamId},
    url: url,
    processData: false,
    contentType: false,
    dataType: "text", //will return something like "Ownership transferred"
    success: function() {
      handleSuccess();
    }.bind(this),
    error: function(xhr, status, err) {
      handleFailure("Failed to transfer component:" + err);
    }.bind(this)
  }, corsRequestParams()));
},

loadComments: function(componentId, type, success, failure) {
  var reg_type = (type === Constants.TYPE_PROFILE) ? PROFILES_PATH : COMPONENTS_PATH;

  $.ajax($.extend({
    url: getConfiguration().restUrl + REGISTRY_ROOT + '/' + reg_type + '/' + componentId + '/comments',
    dataType: "json",
    success: function(data) {
      if(success && data != null) {
        if(data.comment != null) {
          success(data.comment);
        } else {
          success(data);
        }
      } else {
        success([]);
      }
    }.bind(this),
    error: function(xhr, status, err) {
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},

saveComment: function(componentId, type, comment, success, failure) {
  var comments_xml = "<comment><comments>" + comment + "</comments><commentDate/>";
  var reg_type = (type === Constants.TYPE_PROFILE) ? PROFILES_PATH : COMPONENTS_PATH;
  var url = getConfiguration().restUrl + REGISTRY_ROOT + '/' + reg_type + '/' + componentId + '/comments/';

  var fd = new FormData();

  if(type === Constants.TYPE_PROFILE) {
    comments_xml += "<componentId>" + componentId + "</componentId>";
  } else if (type === Constants.TYPE_COMPONENT) {
    comments_xml += "<componentId>" + componentId + "</componentId>";
  }

  comments_xml += "<userName/></comment>";

  fd.append('data', new Blob([ comments_xml ], { type: "application/xml" }));

  $.ajax($.extend({
    type: 'POST',
    url: url,
    data: fd,
    processData: false,
    contentType: false,
    dataType: "json",
    success: function(data) {
      log.trace('comment saved: ', data);
      if(data['@registered'] == 'true') {
        success(data.comment);
      } else {
        failure(data.errors);
      }
    }.bind(this),
    error: function(xhr, status, err) {
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},

deleteComment: function(componentId, type, commentId, success, failure) {
  var reg_type = (type === Constants.TYPE_PROFILE) ? PROFILES_PATH : COMPONENTS_PATH;
  var url = getConfiguration().restUrl + REGISTRY_ROOT + '/' + reg_type + '/' + componentId + '/comments/' + commentId;

  $.ajax($.extend({
    type: 'POST',
    url: url,
    data: { method: 'DELETE' }, // used for POST method of deletion
    success: function(data) {
      success(commentId, data);
    }.bind(this),
    error: function(xhr, status, err) {
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},

loadAllowedTypes: function(success, failure) {
  $.ajax($.extend({
    type: 'GET',
    url: getConfiguration().restUrl + '/allowedTypes',
    processData: false,
    contentType: false,
    dataType:'json',
    success: function(data) {
      if(success) success(data);
    }.bind(this),
    error: function(xhr, status, err) {
      log.error("Failed to retrieve allowed types", err);
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},

loadTeams: function(success, failure) {
  $.ajax($.extend({
    type: 'GET',
    url: getConfiguration().restUrl + '/groups/usermembership',
    processData: false,
    contentType: false,
    dataType:'json',
    success: function(data) {
      if(data == null) {
        success([]);
      } else {
        success(data.group);
      }
    }.bind(this),
    error: function(xhr, status, err) {
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},

loadItemGroups: function(componentId, success, failure) {
  $.ajax($.extend({
    type: 'GET',
    url: getConfiguration().restUrl + '/items/' + componentId + '/groups',
    processData: false,
    contentType: false,
    dataType:'json',
    success: function(data) {
      if(data == null) {
        success([]);
      } else {
        success(data.group);
      }
    }.bind(this),
    error: function(xhr, status, err) {
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},

usageCheck: function(componentId, cb) {
  var url = getConfiguration().restUrl + REGISTRY_ROOT + '/components/usage/' + componentId;

  $.ajax($.extend({
    type: 'GET',
    url: url,
    dataType: "json",
    success: function(data) {
      log.trace('return usage check: ' + data);
      cb(data);
    }.bind(this),
    error: function(xhr, status, err) {
      log.error("Failed to perform usage check", err);
      cb(null);
    }.bind(this)
  }, corsRequestParams()));
},

setStatus: function(componentId, type, targetStatus, success, failure) {
  var reg_type = (type === Constants.TYPE_PROFILE) ? PROFILES_PATH : COMPONENTS_PATH;
  var url = getConfiguration().restUrl + REGISTRY_ROOT + '/' + reg_type + '/' + componentId + '/status';

  var fd = new FormData();
  if(targetStatus === Constants.STATUS_DEVELOPMENT) fd.append('status', "development");
  else if(targetStatus === Constants.STATUS_PRODUCTION) fd.append('status',  "production");
  else if(targetStatus === Constants.STATUS_DEPRECATED) fd.append('status', "deprecated");
  else failure("Unknown status value " + targetStatus);

  $.ajax($.extend({
    type: 'POST',
    url: url,
    data: fd,
    processData: false,
    contentType: false,
    dataType: "text", //will return the new status as text
    success: function(data) {
      log.trace('status updated: ', data);
      success(data);
    }.bind(this),
    error: function(xhr, status, err) {
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},


setSuccessor: function(componentId, type, successorId, success, failure) {
  var reg_type = (type === Constants.TYPE_PROFILE) ? PROFILES_PATH : COMPONENTS_PATH;
  var url = getConfiguration().restUrl + REGISTRY_ROOT + '/' + reg_type + '/' + componentId + '/successor';

  var fd = new FormData();
  fd.append('successor', successorId);

  $.ajax($.extend({
    type: 'POST',
    url: url,
    data: fd,
    processData: false,
    contentType: false,
    dataType: "text", //will return the new status as text
    success: function(data) {
      log.trace('successor updated: ', data);
      success(data);
    }.bind(this),
    error: function(xhr, status, err) {
      failure(err);
    }.bind(this)
  }, corsRequestParams()));
},

queryCCR: function(searchQuery, cb) {
  var url = getConfiguration().ccrUrl + '?type=container&keywords=' + searchQuery;

  if(searchQuery != null || searchQuery != "")
    $.ajax($.extend({
      type: 'GET',
      url: url,
      processData: false,
      contentType: false,
      dataType: "json",
      success: function(data) {
        if(cb)
          cb(data);
      }.bind(this),
      error: function(xhr, status, err) {
        cb(null);
      }.bind(this)
    }, corsRequestParams()));
},

queryVocabularies: function(cb) {
  $.ajax($.extend({
    type: 'GET',
    url: getConfiguration().vocabulariesUrl,
    processData: false,
    contentType: false,
    dataType: "json",
    success: function(data) {
      if(cb)
        cb(data);
    }.bind(this),
    error: function(xhr, status, err) {
      cb(null);
    }.bind(this)
  }, corsRequestParams()));
},

queryVocabularyItems: function(scheme, properties, success, failure, maxResults) {
  $.ajax($.extend({
    type: 'GET',
    url: getConfiguration().vocabularyItemsUrl,
    data: {scheme: scheme, fields: 'uri,' + _.compact(properties).join(), maxResults: maxResults},
    contentType: false,
    dataType: "json",
    success: function(data) {
      if(success)
        success(data);
    }.bind(this),
    error: function(xhr, status, err) {
      if(failure) {
        failure(err);
      }
    }.bind(this)
  }, corsRequestParams()));
},

getAuthState: function(handleSuccess, handleFailure) {
  return $.ajax($.extend({
   url: getConfiguration().restUrl + "/authentication",
   type: 'GET',
   dataType: 'json',
   success: function (result){
     log.trace("Auth check result:", result);
     isAuth = result.authenticated === 'true';
     handleSuccess({
       authenticated: isAuth,
       uid: isAuth ? result.username : null,
       displayName: isAuth ? result.displayName : null,
       isAdmin: isAuth? result.isAdmin === "true" : false,
       userId: isAuth ? result.userId : null
     });
   },
   error: function(xhr, status, err) {
     handleFailure("Could not check authentication state: " + err);
   }
  }, corsRequestParams()));
}

};

module.exports = ComponentRegistryClient;
