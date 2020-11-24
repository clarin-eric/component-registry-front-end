var Component_Module_Factory = function () {
  var Component = {
    name: 'Component',
    typeInfos: [{
        localName: 'EnumerationType',
        typeName: 'enumeration_type',
        propertyInfos: [{
            name: 'appinfo',
            elementName: {
              localPart: 'appinfo'
            }
          }, {
            name: 'item',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'item'
            },
            typeInfo: '.ItemType'
          }]
      }, {
        localName: 'ItemType',
        typeName: 'item_type',
        propertyInfos: [{
            name: 'otherAttributes',
            type: 'anyAttribute'
          }, {
            name: '$',
            type: 'value',
          }, {
            name: '@ConceptLink',
            attributeName: {
              localPart: 'ConceptLink'
            },
            type: 'attribute'
          }, {
            name: '@AppInfo',
            attributeName: {
              localPart: 'AppInfo'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'ValueSchemeType',
        typeName: 'ValueScheme_type',
        propertyInfos: [{
            name: 'pattern',
            required: true,
            elementName: {
              localPart: 'pattern'
            }
          }, {
            name: 'Vocabulary',
            required: true,
            elementName: {
              localPart: 'Vocabulary'
            },
            typeInfo: '.VocabularyType'
          }]
      }, {
        localName: 'AttributeListType.Attribute',
        typeName: null,
        propertyInfos: [{
            name: 'otherAttributes',
            type: 'anyAttribute'
          }, {
            name: 'Documentation',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'Documentation'
            },
            typeInfo: '.DocumentationType'
          }, {
            name: 'ValueScheme',
            elementName: {
              localPart: 'ValueScheme'
            },
            typeInfo: '.ValueSchemeType'
          }, {
            name: 'AutoValue',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'AutoValue'
            }
          }, {
            name: '@name',
            required: true,
            typeInfo: 'Name',
            attributeName: {
              localPart: 'name'
            },
            type: 'attribute'
          }, {
            name: '@ConceptLink',
            attributeName: {
              localPart: 'ConceptLink'
            },
            type: 'attribute'
          }, {
            name: '@ValueScheme',
            typeInfo: 'Token',
            attributeName: {
              localPart: 'ValueScheme'
            },
            type: 'attribute'
          }, {
            name: '@Required',
            typeInfo: 'Boolean',
            attributeName: {
              localPart: 'Required'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'AttributeListType',
        typeName: 'AttributeList_type',
        propertyInfos: [{
            name: 'Attribute',
            required: true,
            collection: true,
            elementName: {
              localPart: 'Attribute'
            },
            typeInfo: '.AttributeListType.Attribute'
          }]
      }, {
        localName: 'ComponentType',
        typeName: 'Component_type',
        propertyInfos: [{
            name: 'otherAttributes',
            type: 'anyAttribute'
          }, {
            name: 'Documentation',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'Documentation'
            },
            typeInfo: '.DocumentationType'
          }, {
            name: 'AttributeList',
            elementName: {
              localPart: 'AttributeList'
            },
            typeInfo: '.AttributeListType'
          }, {
            name: 'Element',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'Element'
            },
            typeInfo: '.ElementType'
          }, {
            name: 'Component',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'Component'
            },
            typeInfo: '.ComponentType'
          }, {
            name: '@name',
            typeInfo: 'Name',
            attributeName: {
              localPart: 'name'
            },
            type: 'attribute'
          }, {
            name: '@ComponentRef',
            attributeName: {
              localPart: 'ComponentRef'
            },
            type: 'attribute'
          }, {
            name: '@ConceptLink',
            attributeName: {
              localPart: 'ConceptLink'
            },
            type: 'attribute'
          }, {
            name: '@CardinalityMin',
            typeInfo: 'String',
            attributeName: {
              localPart: 'CardinalityMin'
            },
            type: 'attribute'
          }, {
            name: '@CardinalityMax',
            typeInfo: 'String',
            attributeName: {
              localPart: 'CardinalityMax'
            },
            type: 'attribute'
          }, {
            name: '@base',
            attributeName: {
              localPart: 'base',
              namespaceURI: 'http:\/\/www.w3.org\/XML\/1998\/namespace'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'DocumentationType',
        typeName: 'Documentation_type',
        propertyInfos: [{
            name: '$',
            type: 'value'
          }, {
            name: '@lang',
            attributeName: {
              localPart: 'lang',
              namespaceURI: 'http:\/\/www.w3.org\/XML\/1998\/namespace'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'ElementType',
        typeName: 'Element_type',
        propertyInfos: [{
            name: 'otherAttributes',
            type: 'anyAttribute'
          }, {
            name: 'Documentation',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'Documentation'
            },
            typeInfo: '.DocumentationType'
          }, {
            name: 'AttributeList',
            elementName: {
              localPart: 'AttributeList'
            },
            typeInfo: '.AttributeListType'
          }, {
            name: 'ValueScheme',
            elementName: {
              localPart: 'ValueScheme'
            },
            typeInfo: '.ValueSchemeType'
          }, {
            name: 'AutoValue',
            minOccurs: 0,
            collection: true,
            elementName: {
              localPart: 'AutoValue'
            }
          }, {
            name: '@cue:DisplayPriority',
            attributeName: {
              localPart: 'DisplayPriority',
              namespaceURI: 'http:\/\/www.clarin.eu\/cmd\/cues\/1'
            },
            type: 'attribute'
          }, {
            name: '@name',
            required: true,
            typeInfo: 'Name',
            attributeName: {
              localPart: 'name'
            },
            type: 'attribute'
          }, {
            name: '@ConceptLink',
            attributeName: {
              localPart: 'ConceptLink'
            },
            type: 'attribute'
          }, {
            name: '@ValueScheme',
            typeInfo: 'Token',
            attributeName: {
              localPart: 'ValueScheme'
            },
            type: 'attribute'
          }, {
            name: '@CardinalityMin',
            typeInfo: 'String',
            attributeName: {
              localPart: 'CardinalityMin'
            },
            type: 'attribute'
          }, {
            name: '@CardinalityMax',
            typeInfo: 'String',
            attributeName: {
              localPart: 'CardinalityMax'
            },
            type: 'attribute'
          }, {
            name: '@Multilingual',
            typeInfo: 'Boolean',
            attributeName: {
              localPart: 'Multilingual'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'VocabularyType',
        typeName: 'Vocabulary_type',
        propertyInfos: [{
            name: 'enumeration',
            elementName: {
              localPart: 'enumeration'
            },
            typeInfo: '.EnumerationType'
          }, {
            name: '@URI',
            attributeName: {
              localPart: 'URI'
            },
            type: 'attribute'
          }, {
            name: '@ValueProperty',
            attributeName: {
              localPart: 'ValueProperty'
            },
            type: 'attribute'
          }, {
            name: '@ValueLanguage',
            typeInfo: 'Language',
            attributeName: {
              localPart: 'ValueLanguage'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'ComponentSpec',
        propertyInfos: [{
            name: 'Header',
            required: true,
            elementName: {
              localPart: 'Header'
            },
            typeInfo: '.ComponentSpec.Header'
          }, {
            name: 'Component',
            required: true,
            elementName: {
              localPart: 'Component'
            },
            typeInfo: '.ComponentType'
          }, {
            name: '@isProfile',
            required: true,
            typeInfo: 'Boolean',
            attributeName: {
              localPart: 'isProfile'
            },
            type: 'attribute'
          }, {
            name: '@CMDVersion',
            required: true,
            typeInfo: 'AnySimpleType',
            attributeName: {
              localPart: 'CMDVersion'
            },
            type: 'attribute'
          }, {
            name: '@CMDOriginalVersion',
            attributeName: {
              localPart: 'CMDOriginalVersion'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'ComponentSpec.Header',
        typeName: null,
        propertyInfos: [{
            name: 'ID',
            required: true,
            elementName: {
              localPart: 'ID'
            }
          }, {
            name: 'Name',
            required: true,
            elementName: {
              localPart: 'Name'
            }
          }, {
            name: 'Description',
            elementName: {
              localPart: 'Description'
            }
          }, {
            name: 'Status',
            required: true,
            elementName: {
              localPart: 'Status'
            }
          }, {
            name: 'StatusComment',
            elementName: {
              localPart: 'StatusComment'
            }
          }, {
            name: 'Successor',
            elementName: {
              localPart: 'Successor'
            }
          }, {
            name: 'DerivedFrom',
            elementName: {
              localPart: 'DerivedFrom'
            }
          }]
      }, {
        type: 'enumInfo',
        localName: 'AllowedAttributetypesType',
        baseTypeInfo: 'Token',
        values: ['boolean', 'decimal', 'float', 'int', 'string', 'anyURI', 'date', 'gDay', 'gMonth', 'gYear', 'time', 'dateTime']
      }],
    elementInfos: [{
        elementName: {
          localPart: 'ComponentSpec'
        },
        typeInfo: '.ComponentSpec'
      }]
  };
  return {
    Component: Component
  };
};
if (typeof define === 'function' && define.amd) {
  define([], Component_Module_Factory);
}
else {
  var Component_Module = Component_Module_Factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.Component = Component_Module.Component;
  }
  else {
    var Component = Component_Module.Component;
  }
}
