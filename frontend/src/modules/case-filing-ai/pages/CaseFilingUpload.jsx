import { useState } from "react";
import { RuleInputPanel } from "../components/RuleInputPanel.jsx";
import { PdfFilingsDropZone } from "../components/PdfFilingsDropZone.jsx";
import { FilingUploadPicker } from "../components/FilingUploadPicker.jsx";
import { UploadedFileList } from "../components/UploadedFileList.jsx";
import { ProcessingStatus } from "../components/ProcessingStatus.jsx";
import { ResultsPanel } from "../components/ResultsPanel.jsx";
import { processBatch } from "../api/caseFilingApi.js";
import { useDocumentFileAccumulator } from "../hooks/use-document-file-accumulator.js";

export function CaseFilingUpload() {
  const [partRuleText, setPartRuleText] = useState("");
  const [partRuleFile, setPartRuleFile] = useState(null);
  const { files, rejectionNote, isAdding, addFiles, removeFile, clearFiles } =
    useDocumentFileAccumulator();
  const [status, setStatus] = useState("idle");
  const [batchId, setBatchId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const processing = status === "processing";
  const canProcess = files.length > 0 && !processing;

  async function handleProcess() {
    setStatus("processing");
    setError(null);
    setResults(null);
    setBatchId(null);

    try {
      const response = await processBatch(files, partRuleText, partRuleFile);
      setResults(response);
      setBatchId(response.batchId);
      setStatus("done");
    } catch (err) {
      setError(err);
      setStatus("idle");
    }
  }

  return (
    <section className="card">
      <h2>Case Filing AI</h2>
      <p className="muted">
        Paste part rules, upload filings (PDF, text, images, Office docs), and process one document
        at a time with a rolling case snapshot.
      </p>

      <RuleInputPanel
        partRuleText={partRuleText}
        onPartRuleTextChange={setPartRuleText}
        onPartRuleFileChange={setPartRuleFile}
      />

      <PdfFilingsDropZone onAddFiles={addFiles} disabled={processing || isAdding}>
        <FilingUploadPicker
          onAddFiles={addFiles}
          disabled={processing}
          isAdding={isAdding}
          fileCount={files.length}
        />
        <UploadedFileList
          files={files}
          onRemoveFile={removeFile}
          onClearFiles={clearFiles}
        />
      </PdfFilingsDropZone>

      {rejectionNote && <p className="error-text">{rejectionNote}</p>}

      <div className="upload-actions">
        <button type="button" onClick={handleProcess} disabled={!canProcess}>
          {processing ? "Processing…" : "Process"}
        </button>
      </div>

      <ProcessingStatus
        status={status === "idle" ? "idle" : status}
        error={error}
        batchId={batchId}
      />
      <ResultsPanel results={results} batchId={batchId} />
    </section>
  );
}
