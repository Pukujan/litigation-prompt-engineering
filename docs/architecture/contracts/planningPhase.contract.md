# planningPhase contract

**Version:** v001  
**Code:** `backend/src/shared/contracts/planningPhase.contract.js`

## Purpose

Audit trail **before** implementation: design MD, plan package, optional study log, JSON manifest under `work-log/planning/`.

## Gate

Run `npm run plan:gate -- --slug <slug>` before executing a tier-L plan.

## API

`GET /api/platform/planning/:planId/download?format=md`
