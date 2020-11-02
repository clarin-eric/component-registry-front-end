'use strict';
var assert = require('chai').assert;
var Jsonix = require('jsonix').Jsonix;
var CMD = require('../../../src/mappings/Component').Component;
var jsonixOptions = require('../../../src/mappings/jsonixOptions');

var chai    = require('chai');
var expect  = require('chai').expect;
var chaiXml = require('chai-xml');
chai.use(chaiXml);

var data1 = {
    "@isProfile": "true",
    "@CMDVersion": "1.2",
    "@CMDOriginalVersion": "1.1",
    "Header": {
        "ID": "clarin.eu:cr1:p_1361876010587",
        "Name": "AnnotatedCorpusProfile-DLU",
        "Description": "A CMDI profile for annotated text corpus resources.",
        "Status": "production"
    },
    "Component": {
        "@name": "AnnotatedCorpusProfile-DLU",
        "@CardinalityMin": "1",
        "@CardinalityMax": "1",
        "Component": [
            {
                "@ComponentRef": "clarin.eu:cr1:c_1361876010584",
                "@CardinalityMin": "1",
                "@CardinalityMax": "1"
            }
        ]
    }
};
var expectedOut1 =`
  <ComponentSpec isProfile="true" CMDVersion="1.2" CMDOriginalVersion="1.1"
    xmlns:cue="http://www.clarin.eu/cmdi/cues/1">
    <Header>
      <ID>clarin.eu:cr1:p_1361876010587</ID>
      <Name>AnnotatedCorpusProfile-DLU</Name>
      <Description>A CMDI profile for annotated text corpus resources.</Description>
      <Status>production</Status>
    </Header>
    <Component name="AnnotatedCorpusProfile-DLU" CardinalityMin="1" CardinalityMax="1">
        <Component ComponentRef="clarin.eu:cr1:c_1361876010584" CardinalityMin="1" CardinalityMax="1" />
    </Component>
  </ComponentSpec>
`;

var data2 = {
    "@isProfile": "true",
    "@CMDVersion": "1.2",
    "@CMDOriginalVersion": "1.1",
    "Header": {
        "ID": "clarin.eu:cr1:p_1288172614014",
        "Name": "BamdesLexicalResource",
        "Description": "Lexical Resource as used by BAMDES (for theharvestingday.eu)",
        "Status": "production"
    },
    "Component": {
        "@name": "BamdesLexicalResource",
        "@CardinalityMin": "1",
        "@CardinalityMax": "1",
        "Element": [
            {
                "@name": "resourceType",
                "@CardinalityMin": "1",
                "@CardinalityMax": "1",
                "@cue:DisplayPriority": "1",
                "ValueScheme": {"Vocabulary": {"enumeration": {"item": [{
                    "@ConceptLink": "",
                    "@AppInfo": "",
                    "$": "LexicalResource"
                }]}}},
            },
            {
                "@name": "language",
                "@ConceptLink": "http://hdl.handle.net/11459/CCR_C-2484_669684e7-cb9e-ea96-59cb-a25fe89b9b9d",
                "@ValueScheme": "string",
                "@CardinalityMin": "0",
                "@CardinalityMax": "unbounded",
                "AttributeList": {"Attribute": [{
                    "@name": "languageID",
                    "ValueScheme": {"pattern": "[A-Za-z][A-Za-z][A-Za-z]?"},
                }]},
            },
            {
                "@name": "lexiconType",
                "@ConceptLink": "http://hdl.handle.net/11459/CCR_C-2487_472ad387-0b4e-3782-cb65-be9b20cb656d",
                "@CardinalityMin": "1",
                "@CardinalityMax": "1",
                "ValueScheme": {"Vocabulary": {"enumeration": {"item": [
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "monolingual"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "bilingual"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "multilingual"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "computational lexicon"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "machine readable dictionary"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "multimedia dictionary"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "other"
                    }
                ]}}},
            },
            {
                "@name": "size",
                "@ConceptLink": "http://hdl.handle.net/11459/CCR_C-2580_6dfe4e09-1c61-9b24-98ad-16bb867860fe",
                "@ValueScheme": "string",
                "@CardinalityMin": "0",
                "@CardinalityMax": "unbounded",
                "AttributeList": {"Attribute": [{
                    "@name": "sizeUnit",
                    "@ValueScheme": "string",
                }]},
            },
            {
                "@name": "coverageType",
                "@CardinalityMin": "1",
                "@CardinalityMax": "1",
                "ValueScheme": {"Vocabulary": {"enumeration": {"item": [
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "general"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "domain specific"
                    }
                ]}}},
            },
            {
                "@name": "domain",
                "@ConceptLink": "http://hdl.handle.net/11459/CCR_C-2467_f4e7331f-b930-fc42-eeea-05e383cfaa78",
                "@ValueScheme": "string",
                "@CardinalityMin": "0",
                "@CardinalityMax": "unbounded",
            },
            {
                "@name": "annotationFormat",
                "@ConceptLink": "http://hdl.handle.net/11459/CCR_C-2562_872eb94a-47fb-b551-2f64-13ded063259e",
                "@ValueScheme": "string",
                "@CardinalityMin": "1",
                "@CardinalityMax": "1",
            },
            {
                "@name": "informationContained",
                "@CardinalityMin": "0",
                "@CardinalityMax": "unbounded",
                "ValueScheme": {"Vocabulary": {"enumeration": {"item": [
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "definition"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "equivalents"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "neologisms"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "example of use"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "collocations"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "selectional restrictions"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "phonology"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "morphology"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "syntax"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "semantics"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "phonetics"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "synonyms"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "antonyms"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "etymology"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "related entry/entries"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "context"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "source"
                    },
                    {
                        "@ConceptLink": "",
                        "@AppInfo": "",
                        "$": "other"
                    }
                ]}}},
            }
        ],
        "Component": [{
            "@ComponentRef": "clarin.eu:cr1:c_1288172614011",
            "@CardinalityMin": "1",
            "@CardinalityMax": "1",
        }],
    }
};

var expectedOut2 = `
  <ComponentSpec isProfile="true" CMDVersion="1.2" CMDOriginalVersion="1.1"
    xmlns:cue="http://www.clarin.eu/cmdi/cues/1">
    <Header>
      <ID>clarin.eu:cr1:p_1288172614014</ID>
      <Name>BamdesLexicalResource</Name>
      <Description>Lexical Resource as used by BAMDES (for theharvestingday.eu)</Description>
      <Status>production</Status>
    </Header>
    <Component name="BamdesLexicalResource" CardinalityMin="1" CardinalityMax="1">
      <Element  cue:DisplayPriority="1" name="resourceType" CardinalityMin="1" CardinalityMax="1">
        <ValueScheme>
          <Vocabulary>
            <enumeration>
              <item ConceptLink="" AppInfo="">LexicalResource</item>
            </enumeration>
          </Vocabulary>
        </ValueScheme>
      </Element>
      <Element name="language" ConceptLink="http://hdl.handle.net/11459/CCR_C-2484_669684e7-cb9e-ea96-59cb-a25fe89b9b9d" ValueScheme="string" CardinalityMin="0" CardinalityMax="unbounded">
        <AttributeList>
          <Attribute name="languageID">
            <ValueScheme>
              <pattern>[A-Za-z][A-Za-z][A-Za-z]?</pattern>
            </ValueScheme>
          </Attribute>
        </AttributeList>
      </Element>
      <Element name="lexiconType" ConceptLink="http://hdl.handle.net/11459/CCR_C-2487_472ad387-0b4e-3782-cb65-be9b20cb656d" CardinalityMin="1" CardinalityMax="1">
        <ValueScheme>
          <Vocabulary>
            <enumeration>
              <item ConceptLink="" AppInfo="">monolingual</item>
              <item ConceptLink="" AppInfo="">bilingual</item>
              <item ConceptLink="" AppInfo="">multilingual</item>
              <item ConceptLink="" AppInfo="">computational lexicon</item>
              <item ConceptLink="" AppInfo="">machine readable dictionary</item>
              <item ConceptLink="" AppInfo="">multimedia dictionary</item>
              <item ConceptLink="" AppInfo="">other</item>
            </enumeration>
          </Vocabulary>
        </ValueScheme>
      </Element>
      <Element name="size" ConceptLink="http://hdl.handle.net/11459/CCR_C-2580_6dfe4e09-1c61-9b24-98ad-16bb867860fe" ValueScheme="string" CardinalityMin="0" CardinalityMax="unbounded">
        <AttributeList>
          <Attribute name="sizeUnit" ValueScheme="string"/>
        </AttributeList>
      </Element>
      <Element name="coverageType" CardinalityMin="1" CardinalityMax="1">
        <ValueScheme>
          <Vocabulary>
            <enumeration>
              <item ConceptLink="" AppInfo="">general</item>
              <item ConceptLink="" AppInfo="">domain specific</item>
            </enumeration>
          </Vocabulary>
        </ValueScheme>
      </Element>
      <Element name="domain" ConceptLink="http://hdl.handle.net/11459/CCR_C-2467_f4e7331f-b930-fc42-eeea-05e383cfaa78" ValueScheme="string" CardinalityMin="0" CardinalityMax="unbounded"/>
      <Element name="annotationFormat" ConceptLink="http://hdl.handle.net/11459/CCR_C-2562_872eb94a-47fb-b551-2f64-13ded063259e" ValueScheme="string" CardinalityMin="1" CardinalityMax="1"/>
      <Element name="informationContained" CardinalityMin="0" CardinalityMax="unbounded">
        <ValueScheme>
          <Vocabulary>
            <enumeration>
              <item ConceptLink="" AppInfo="">definition</item>
              <item ConceptLink="" AppInfo="">equivalents</item>
              <item ConceptLink="" AppInfo="">neologisms</item>
              <item ConceptLink="" AppInfo="">example of use</item>
              <item ConceptLink="" AppInfo="">collocations</item>
              <item ConceptLink="" AppInfo="">selectional restrictions</item>
              <item ConceptLink="" AppInfo="">phonology</item>
              <item ConceptLink="" AppInfo="">morphology</item>
              <item ConceptLink="" AppInfo="">syntax</item>
              <item ConceptLink="" AppInfo="">semantics</item>
              <item ConceptLink="" AppInfo="">phonetics</item>
              <item ConceptLink="" AppInfo="">synonyms</item>
              <item ConceptLink="" AppInfo="">antonyms</item>
              <item ConceptLink="" AppInfo="">etymology</item>
              <item ConceptLink="" AppInfo="">related entry/entries</item>
              <item ConceptLink="" AppInfo="">context</item>
              <item ConceptLink="" AppInfo="">source</item>
              <item ConceptLink="" AppInfo="">other</item>
            </enumeration>
          </Vocabulary>
        </ValueScheme>
      </Element>
      <Component ComponentRef="clarin.eu:cr1:c_1288172614011" CardinalityMin="1" CardinalityMax="1"/>
    </Component>
  </ComponentSpec>
`;

describe('Component', function () {
  var context = new Jsonix.Context([CMD], jsonixOptions);
  var marshaller = context.createMarshaller();

  describe('marshall1', function() {
    var xmlOut = marshaller.marshalString({ name: new Jsonix.XML.QName('ComponentSpec'), value: data1 });
    it('should marshall', function() {
      //assert.equal(expectedOut, xmlOut);
      expect(expectedOut1).xml.to.deep.equal(xmlOut);
    });
  });

  describe('marshall2', function() {
    var xmlOut = marshaller.marshalString({ name: new Jsonix.XML.QName('ComponentSpec'), value: data2 });
    it('should marshall', function() {
      //assert.equal(expectedOut, xmlOut);
      expect(expectedOut2).xml.to.deep.equal(xmlOut);
    });
  });
});
