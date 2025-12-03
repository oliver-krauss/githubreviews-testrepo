**What is this Test IG?**

This is a minimal test Implementation Guide created to test GitHub review functionality. It contains a simplified AuditEvent profile to demonstrate the structure of a FHIR Implementation Guide.

**Test Profile**

The Test IG includes a core AuditEvent profile that enforces:
- **Patient** - The patient this Audit event is for
- **EventTime** - When the event was conducted

### Profile Details

The `TestAuditEventCore` profile extends the base FHIR AuditEvent resource and requires:
- A reference to the patient (mandatory)
- The date/time when the event occurred (mandatory)

This minimal profile demonstrates how FHIR profiles can be used to enforce specific requirements on resources.

### Usage

This Implementation Guide is intended for testing purposes only. It demonstrates:
- FSH file structure
- Profile definitions
- Markdown documentation
- GitHub Pages deployment

