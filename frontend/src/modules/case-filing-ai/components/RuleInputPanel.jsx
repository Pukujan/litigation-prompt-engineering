import { useRef, useState } from "react";
import { extractRuleText } from "../api/caseFilingApi.js";

const RULE_FILE_HINT = "PDF, TXT, MD, DOC, DOCX, RTF, HTML, or paste below";

export function RuleInputPanel({
  partRuleText,
  onPartRuleTextChange,
  onPartRuleFileChange
}) {
  const fileInputRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRuleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadError("");
    setLoading(true);

    try {
      const result = await extractRuleText(file);
      onPartRuleTextChange(result.text);
      onPartRuleFileChange?.(file);

      if (result.extractionQuality?.ocr_needed) {
        setLoadError(
          "Text was extracted but may be incomplete (OCR may be needed). Review the pasted rule text before processing."
        );
      }
    } catch (err) {
      setLoadError(err.message || `Could not read ${file.name}.`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openRuleFilePicker() {
    if (loading) return;
    fileInputRef.current?.click();
  }

  return (
    <div className="panel">
      <h3>Part rule</h3>
      <p className="muted">
        Paste or upload the part rule text that applies to this batch. If omitted, applicable rules
        will be inferred from the filings.
      </p>
      <textarea
        className="rule-textarea"
        rows={8}
        value={partRuleText}
        onChange={(e) => {
          onPartRuleTextChange(e.target.value);
          if (!e.target.value.trim()) {
            onPartRuleFileChange?.(null);
          }
        }}
        placeholder="Paste part rule text here…"
      />
      <div className="rule-upload-row">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleRuleFileChange}
          disabled={loading}
          className="file-input-native-hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          className="file-picker-button"
          onClick={openRuleFilePicker}
          disabled={loading}
        >
          {loading ? "Extracting text…" : "Upload rule file"}
        </button>
        <span className="muted">{RULE_FILE_HINT}</span>
      </div>
      {loadError && <p className="error-text">{loadError}</p>}
    </div>
  );
}
