Parse the supplied part rule text into structured JSON for reuse in a case filing pipeline.

Part rule text:
{{partRuleText}}

Return strict JSON only:
{
  "partName": null,
  "judgeName": null,
  "county": null,
  "court": null,
  "rules": [],
  "schedulingNotes": [],
  "deadlinePolicies": [],
  "sourceSummary": "",
  "confidence": "high|medium|low"
}

Do not invent rules not present in the supplied text.
