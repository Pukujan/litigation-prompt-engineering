import { useRef } from "react";
import { SUPPORTED_UPLOAD_HINT } from "../utils/document-files.js";

export function FilingUploadPicker({ onAddFiles, disabled, fileCount, isAdding }) {
  const inputRef = useRef(null);
  const pickerDisabled = disabled || isAdding;

  function handleChange(event) {
    onAddFiles(Array.from(event.target.files ?? []));
    if (inputRef.current) inputRef.current.value = "";
  }

  function openFilePicker() {
    if (pickerDisabled) return;
    inputRef.current?.click();
  }

  return (
    <div className="panel filing-upload-panel">
      <h3>Case filings</h3>
      <p className="muted">
        Choose files or drag and drop them anywhere in this section. You can add more in multiple
        batches — each drop or selection adds to the list ({fileCount} selected).
      </p>
      <p className="muted supported-types">{SUPPORTED_UPLOAD_HINT}</p>

      <div className="file-dropzone-inner">
        {/* Hidden input + button click() is reliable on macOS Finder; no accept filter. */}
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          disabled={pickerDisabled}
          className="file-input-native-hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          className="file-picker-button"
          disabled={pickerDisabled}
          onClick={openFilePicker}
        >
          {isAdding ? "Checking files…" : "Choose files"}
        </button>
        <span className="muted">macOS Finder shows all files — PDFs included</span>
      </div>
    </div>
  );
}
