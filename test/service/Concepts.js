'use strict';
const jsonld = require('jsonld');

const testData = {
  "uri": "",
  "results": [{
    "uri": "http://hdl.handle.net/11459/CCR_C-4442_0c97f01b-fb0e-7698-22e9-6751abf19d8c",
    "type": "skos:Concept",
    "notation": "achievementTest",
    "prefLabel": ["achievement test", {
      "@language": "en",
      "@value": "achievement test"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-6576_00e92a72-bc75-2f4c-14ac-3e7e7e81d0d6",
    "type": "skos:Concept",
    "notation": "languageTest",
    "prefLabel": ["language test", {
      "@language": "en",
      "@value": "language test"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-4588_d239ca3a-da99-9462-d39e-61c47a058a7d",
    "type": "skos:Concept",
    "notation": "normalizedTest",
    "prefLabel": ["normalized test", {
      "@language": "en",
      "@value": "normalized test"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-4443_609384f0-6920-a202-2b59-b88e0d4eede0",
    "type": "skos:Concept",
    "notation": "personalityTest",
    "prefLabel": ["personality test", {
      "@language": "en",
      "@value": "personality test"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-4544_a1d17d6f-9aff-cb4d-3f9a-3656ea02d05b",
    "type": "skos:Concept",
    "notation": "pretestPosttestDesign",
    "prefLabel": ["pretest-posttest design", {
      "@language": "en",
      "@value": "pretest-posttest design"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-4587_0d14e357-7f0e-31f1-c80e-1b24cd76b5be",
    "type": "skos:Concept",
    "notation": "standardizedTest",
    "prefLabel": ["standardized test", {
      "@language": "en",
      "@value": "standardized test"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-4367_c9696d87-7039-55d4-f661-2a96fac95f38",
    "type": "skos:Concept",
    "notation": "testData",
    "prefLabel": ["test data", {
      "@language": "en",
      "@value": "test data"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-3870_9777e4e9-4826-090a-a966-3cb7e726b92f",
    "type": "skos:Concept",
    "notation": "testType",
    "prefLabel": ["test type", {
      "@language": "en",
      "@value": "test type"
    }]
  }, {
    "uri": "http://hdl.handle.net/11459/CCR_C-4430_4e43a338-df90-a14e-151e-95b685541295",
    "type": "skos:Concept",
    "notation": "testing",
    "prefLabel": ["testing", {
      "@language": "en",
      "@value": "testing"
    }]
  }],
  "@context": {
    "uri": "@id",
    "type": "@type",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "onki": "http://schema.onki.fi/onki#",
    "isothes": "http://purl.org/iso25964/skos-thes#",
    "prefLabel": "skos:prefLabel",
    "altLabel": "skos:altLabel",
    "hiddenLabel": "skos:hiddenLabel",
    "definition": "skos:definition",
    "notation": "skos:notation",
    "results": {
      "@id": "onki:results",
      "@container": "@list"
    }
  }
}

const context = {
  "uri": "@id",
  "type": "@type",
  "skos": "http://www.w3.org/2004/02/skos/core#",
  "isothes": "http://purl.org/iso25964/skos-thes#",
  "onki": "http://schema.onki.fi/onki#",
  "prefLabel": "skos:prefLabel",
  "altLabel": "skos:altLabel",
  "hiddenLabel": "skos:hiddenLabel",
  "definition": "skos:definition",
  "result": { "@id": "onki:results", "@container": "@list" }
};

async function test() {
  const processor = jsonld.JsonLdProcessor;
  const printJson = result => console.log(JSON.stringify(result));

  const compacted = await processor.compact(testData, context);
  console.log('Compacted:\n');
  printJson(compacted);

  const expanded = await processor.expand(testData);
  console.log('\nExpanded:\n');
  printJson(expanded);
}

test().then(() => console.log('\nDone'));