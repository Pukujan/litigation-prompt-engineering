# Filing Text Vault Prompt

Save every text version separately.

For each document, save:
1. embedded_text if available
2. ocr_text if OCR was used
3. ai_parsed_text
4. human_reviewed_text only after human correction/approval

Default status:
- embedded_text = unreviewed
- ocr_text = unreviewed
- ai_parsed_text = unreviewed
- human_reviewed_text = reviewed

Do not replace old versions.
Create a new version for every meaningful change.
