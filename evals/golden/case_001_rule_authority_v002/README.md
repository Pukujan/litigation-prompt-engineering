# Golden dataset: case_001_rule_authority_v002

Rule-authority v002 synthetic expected outputs (14 documents). Installed from
`file-exchange/imports/evals/golden/synthetic_case_001_rule_authority_v002/` via:

```bash
npm run ingest:golden-v002
```

Does **not** replace `evals/golden/case_001/` (minimal CI slice).

## Run evals

```bash
npm run eval:golden -- --dataset case_001_rule_authority_v002
npm run eval:golden -- --all
```

## Covers

- Parsed extraction quality metadata (per-doc `expectedExtractionQuality`)
- `pipeline_versions.expected.json`
- `expectedRuleSourcesApplied` and task `sourceAuthority`
- `rule_sources_catalog.json` (CPLR, Uniform 202.56, Queens med-mal, PC/CC forms, Compliance Part, Kerrigan Part 10, case orders)
- Snapshot supersession (e.g. later CC order vs earlier NOI)
- `negative_guardrails.expected.json`
