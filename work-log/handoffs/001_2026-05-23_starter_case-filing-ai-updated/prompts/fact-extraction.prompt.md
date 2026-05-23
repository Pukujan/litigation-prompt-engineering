# Fact Extraction Prompt

Extract facts from the current document only.

You may use prior CaseStateSnapshot as context to understand the case, but do not treat prior context as proof that the current document confirms the same fact.

Extract:
- index number
- county
- court
- caption
- plaintiffs
- infant plaintiffs
- defendants
- judge
- part
- counsel
- filed date
- service date
- related case references
- case type
- witnesses
- facility/provider references

For each fact, return:
- fieldName
- value
- sourceDocumentNumber
- sourcePage
- confidence
- status: confirmed_by_current_document | carried_forward_context | newly_discovered | enriched_from_current_document | conflict_needs_review | visual_review_required

If the current document does not clearly show a fact, but the prior snapshot contains it, carry it forward as context.

Do not guess. Do not overwrite confirmed facts. Do not force unknown roles.
