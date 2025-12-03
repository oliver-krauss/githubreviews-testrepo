/*##############################################################################
# Type:       FSH-File for a FHIR® Profile
# About:      Test Core Profile for AuditEvent.
# Created by: Test
##############################################################################*/

Profile:        TestAuditEventCore
Parent:         AuditEvent
Id:             test-auditevent-core
Title:          "Test Core AuditEvent Profile"
Description:    "Test Core AuditEvent Profile enforcing the patient and event time"

// Define Mandatory Fields (ae.patient and occurred)
* patient 1..1 
* patient ^short = "The patient this Audit event is for."
* occurredDateTime 1..1
* occurredDateTime ^short = "Documents when the event was conducted, not when it was audited."

