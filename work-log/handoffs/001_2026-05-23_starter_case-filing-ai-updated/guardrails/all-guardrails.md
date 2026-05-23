# Guardrails

## Source grounding

1. The current document is the source of truth for facts extracted from that document.
2. Prior case context may help resolve references, but does not count as confirmation.
3. If a fact comes only from prior context, mark it as carried_forward_context.
4. If the current document confirms a prior fact, mark it as confirmed_by_current_document.
5. If the current document adds missing details, enrich the model and cite the current document.
6. If the current document conflicts with prior confirmed facts, create a conflict item.
7. Do not silently overwrite.

## Correction and enrichment

1. Early documents may create partial models.
2. Later documents may enrich missing fields.
3. Later documents may correct provisional fields.
4. Later documents may supersede earlier deadlines or tasks.
5. Human-verified facts outrank AI-extracted facts.
6. Court orders outrank party notices when deadlines conflict.
7. Later court orders may supersede earlier court orders.
8. Do not delete old values. Mark them corrected_later or superseded.
9. Preserve audit history.

## Rule retrieval

Do not dump every rule into the prompt.

Retrieve relevant layered rules only:
1. statewide / court-wide
2. county
3. judge / part
4. case type
5. document specific
6. firm/internal workflow

## Human review

Only OCR/handwriting/visual uncertainty blocks workflow.
Normal extraction becomes ai_extracted_unreviewed.
