# Legal Ops UI (demo adapter)

React adapters that fill **litigation_workflow Patch 07E**-style tables and **Patch 07B**-style metric cards using data from `GET /api/case-filing-demo/cases/:id/bundle`.

**Source pattern:** `file-exchange/imports/imported case module/litigation_workflow_v4_extension_ready/` (Legal Ops dashboard + datalog table CSS/HTML layout).

No separate litigation-workflow backend is required for the Vercel demo — `mapDemoBundleToLegalOps.js` derives worklog rows from audit replay + eval bundle.
