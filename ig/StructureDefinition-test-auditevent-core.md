# TESTIG\Test Core AuditEvent Profile - FHIR® v5.0.0

* [**Table of Contents**](toc.md)
* [**Artifacts Summary**](artifacts.md)
* **Test Core AuditEvent Profile**

## Resource Profile: Test Core AuditEvent Profile 

| | |
| :--- | :--- |
| *Official URL*:http://example.org/fhir/TestIG/StructureDefinition/test-auditevent-core | *Version*:0.1.0 |
| Active as of 2025-12-03 | *Computable Name*:TestAuditEventCore |

 
Test Core AuditEvent Profile enforcing the patient and event time 

**Usages:**

* This Profile is not used by any profiles in this Implementation Guide

You can also check for [usages in the FHIR IG Statistics](https://packages2.fhir.org/xig/TestIG|current/StructureDefinition/test-auditevent-core)

### Formal Views of Profile Content

 [Description of Profiles, Differentials, Snapshots and how the different presentations work](http://build.fhir.org/ig/FHIR/ig-guidance/readingIgs.html#structure-definitions). 

 

Other representations of profile: [CSV](StructureDefinition-test-auditevent-core.csv), [Excel](StructureDefinition-test-auditevent-core.xlsx), [Schematron](StructureDefinition-test-auditevent-core.sch) 



## Resource Content

```json
{
  "resourceType" : "StructureDefinition",
  "id" : "test-auditevent-core",
  "url" : "http://example.org/fhir/TestIG/StructureDefinition/test-auditevent-core",
  "version" : "0.1.0",
  "name" : "TestAuditEventCore",
  "title" : "Test Core AuditEvent Profile",
  "status" : "active",
  "date" : "2025-12-03T21:20:51+00:00",
  "description" : "Test Core AuditEvent Profile enforcing the patient and event time",
  "fhirVersion" : "5.0.0",
  "mapping" : [
    {
      "identity" : "workflow",
      "uri" : "http://hl7.org/fhir/workflow",
      "name" : "Workflow Pattern"
    },
    {
      "identity" : "w5",
      "uri" : "http://hl7.org/fhir/fivews",
      "name" : "FiveWs Pattern Mapping"
    },
    {
      "identity" : "rim",
      "uri" : "http://hl7.org/v3",
      "name" : "RIM Mapping"
    },
    {
      "identity" : "dicom",
      "uri" : "http://nema.org/dicom",
      "name" : "DICOM Tag Mapping"
    },
    {
      "identity" : "w3c.prov",
      "uri" : "http://www.w3.org/ns/prov",
      "name" : "W3C PROV"
    },
    {
      "identity" : "fhirprovenance",
      "uri" : "http://hl7.org/fhir/provenance",
      "name" : "FHIR Provenance Mapping"
    }
  ],
  "kind" : "resource",
  "abstract" : false,
  "type" : "AuditEvent",
  "baseDefinition" : "http://hl7.org/fhir/StructureDefinition/AuditEvent",
  "derivation" : "constraint",
  "differential" : {
    "element" : [
      {
        "id" : "AuditEvent",
        "path" : "AuditEvent"
      },
      {
        "id" : "AuditEvent.occurred[x]",
        "path" : "AuditEvent.occurred[x]",
        "slicing" : {
          "discriminator" : [
            {
              "type" : "type",
              "path" : "$this"
            }
          ],
          "ordered" : false,
          "rules" : "open"
        },
        "min" : 1
      },
      {
        "id" : "AuditEvent.occurred[x]:occurredDateTime",
        "path" : "AuditEvent.occurred[x]",
        "sliceName" : "occurredDateTime",
        "short" : "Documents when the event was conducted, not when it was audited.",
        "min" : 1,
        "max" : "1",
        "type" : [
          {
            "code" : "dateTime"
          }
        ]
      },
      {
        "id" : "AuditEvent.patient",
        "path" : "AuditEvent.patient",
        "short" : "The patient this Audit event is for.",
        "min" : 1
      }
    ]
  }
}

```
