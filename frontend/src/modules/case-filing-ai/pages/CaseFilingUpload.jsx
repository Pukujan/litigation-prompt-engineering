import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RuleInputPanel } from "../components/RuleInputPanel.jsx";
import { PdfFilingsDropZone } from "../components/PdfFilingsDropZone.jsx";
import { FilingUploadPicker } from "../components/FilingUploadPicker.jsx";
import { UploadedFileList } from "../components/UploadedFileList.jsx";
import { ProcessingStatus } from "../components/ProcessingStatus.jsx";
import { ResultsPanel } from "../components/ResultsPanel.jsx";
import { BatchRunSummary } from "../components/BatchRunSummary.jsx";
import { DocumentQueuePanel } from "../components/DocumentQueuePanel.jsx";
import { PipelineModuleRail } from "../components/PipelineModuleRail.jsx";
import { getBatchEvals, getPlatformModules, processBatch } from "../api/caseFilingApi.js";
import { useDocumentFileAccumulator } from "../hooks/use-document-file-accumulator.js";
import { useBatchSession } from "../hooks/useBatchSession.js";

export function CaseFilingUpload() {
  const [partRuleText, setPartRuleText] = useState("");
  const [partRuleFile, setPartRuleFile] = useState(null);
  const { files, rejectionNote, isAdding, addFiles, removeFile, clearFiles } =
    useDocumentFileAccumulator();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [evalReports, setEvalReports] = useState([]);
  const [modules, setModules] = useState([]);
  const { batchId, setBatchId, status: pollStatus, results, polling, history, resumeBatch } =
    useBatchSession();

  useEffect(() => {
    getPlatformModules()
      .then((data) => setModules(data.modules ?? []))
      .catch(() => setModules([]));
  }, []);

  useEffect(() => {
    if (!batchId || !results) return;
    getBatchEvals(batchId)
      .then((data) => setEvalReports(data.reports ?? []))
      .catch(() => setEvalReports([]));
  }, [batchId, results]);

  const processing = status === "processing" || polling;
  const canProcess = files.length > 0 && !processing;
  const displayResults = results;
  const displayBatchId = batchId ?? displayResults?.batchId;

  async function handleProcess() {
    setStatus("processing");
    setError(null);
    setEvalReports([]);

    try {
      const started = await processBatch(files, partRuleText, partRuleFile);
      setBatchId(started.batchId);
      clearFiles();
      setStatus("polling");
    } catch (err) {
      setError(err);
      setStatus("idle");
    }
  }

  useEffect(() => {
    if (status === "polling" && results && !polling) {
      setStatus("done");
    }
  }, [status, results, polling]);

  const liveModuleStates =
    pollStatus?.moduleStates?.map((m) => {
      const meta = modules.find((x) => x.id === m.id);
      return { ...m, displayName: meta?.displayName, icon: meta?.icon };
    }) ?? [];

  return (
    <section className="card">
      <h2>Case Filing AI</h2>
      <p className="muted">
        Paste part rules, upload filings, and process one document at a time with a rolling case
        snapshot. <Link to="/onboarding">Pipeline guide</Link>
      </p>

      {history.length > 0 && (
        <details className="batch-history">
          <summary>Batch history</summary>
          <ul>
            {history.map((id) => (
              <li key={id}>
                <button type="button" className="link-button" onClick={() => resumeBatch(id)}>
                  {id}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

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
        <UploadedFileList files={files} onRemoveFile={removeFile} onClearFiles={clearFiles} />
      </PdfFilingsDropZone>

      {rejectionNote && <p className="error-text">{rejectionNote}</p>}

      <div className="upload-actions">
        <button type="button" onClick={handleProcess} disabled={!canProcess}>
          {processing ? "Processing…" : "Process"}
        </button>
      </div>

      {processing && liveModuleStates.length > 0 && (
        <div className="panel pipeline-live">
          <PipelineModuleRail
            moduleStates={liveModuleStates}
            activeModule={pollStatus?.activeModule}
          />
          <DocumentQueuePanel
            documentQueue={pollStatus?.documentQueue ?? []}
            processedCount={pollStatus?.processedCount}
            totalCount={pollStatus?.totalCount}
          />
        </div>
      )}

      <ProcessingStatus
        status={processing ? "processing" : status === "done" ? "done" : "idle"}
        error={error}
        batchId={displayBatchId}
      />

      {(displayResults || pollStatus) && (
        <BatchRunSummary
          results={displayResults}
          status={pollStatus}
          evalReports={evalReports}
          modules={modules}
        />
      )}

      <ResultsPanel
        results={displayResults}
        batchId={displayBatchId}
        evalReports={evalReports}
      />
    </section>
  );
}
