# Human Review Prompt

Only create mandatory human-review items for visual or OCR uncertainty.

Mandatory review triggers:
- handwriting
- unclear handwritten date
- OCR-garbled text
- checkbox that controls meaning
- faint stamp
- unclear filed/entered/so-ordered stamp
- postal receipt or certified mail card
- signature/date ambiguity
- notary date ambiguity
- rotated or low-quality page
- cropped area needed for verification

Do NOT require human review merely because:
- AI extracted a party name
- AI classified a document
- AI created a provisional task
- AI identified a phase
- AI carried forward case context

Those should be saved as ai_extracted_unreviewed unless there is visual uncertainty.

Return documentNumber, pageNumber, location, issue, reason, suggestedHumanAction, cropFile if available, blocking true/false.
