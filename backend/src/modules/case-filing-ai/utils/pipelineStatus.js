const RUNTIME_MODULES = [
  "part-rules",
  "parse",
  "court-rules",
  "master-prompt",
  "snapshot",
  "eval"
];

const STEP_TO_MODULE = {
  batch_started: "part-rules",
  document_started: "parse",
  module_started: null,
  module_completed: null,
  document_completed: "eval",
  document_failed: null,
  batch_completed: null
};

function emptyModuleStates() {
  return RUNTIME_MODULES.map((id) => ({ id, status: "pending" }));
}

function deriveDocSteps(log, docIndex) {
  const steps = {
    parse: "pending",
    rules: "pending",
    extract: "pending",
    snapshot: "pending",
    eval: "pending"
  };
  const moduleMap = {
    parse: "parse",
    "court-rules": "rules",
    "master-prompt": "extract",
    snapshot: "snapshot",
    eval: "eval"
  };

  let active = null;
  for (const entry of log) {
    if (entry.docIndex !== docIndex) continue;
    if (entry.step === "document_failed") {
      return { ...steps, parse: "failed" };
    }
    if (entry.step === "document_completed") {
      return {
        parse: "done",
        rules: "done",
        extract: "done",
        snapshot: "done",
        eval: "done"
      };
    }
    if (entry.step === "module_completed" && entry.module) {
      const key = moduleMap[entry.module];
      if (key) steps[key] = "done";
    }
    if (entry.step === "module_started" && entry.module) {
      const key = moduleMap[entry.module];
      if (key) {
        for (const k of Object.keys(steps)) {
          if (steps[k] === "pending" && k !== key) {
            // leave prior as pending until completed
          }
        }
        steps[key] = "active";
        active = key;
      }
    }
  }
  if (active) {
    for (const [k, v] of Object.entries(steps)) {
      if (v === "pending" && k !== active) {
        // still pending
      }
    }
  }
  return steps;
}

export function buildPipelineStatusFromLog(log, uploads = []) {
  const lastEntry = log[log.length - 1] ?? {};
  const isComplete = lastEntry.step === "batch_completed";
  const batchStatus = isComplete
    ? lastEntry.batchStatus ?? "completed"
    : log.length
      ? "processing"
      : "pending";

  const moduleStates = emptyModuleStates();
  let activeModule = "part-rules";

  if (log.some((e) => e.step === "batch_started")) {
    moduleStates.find((m) => m.id === "part-rules").status = "done";
  }

  const currentDocEntry = [...log].reverse().find((e) => e.step === "document_started");
  const currentDocIndex = currentDocEntry?.docIndex ?? null;

  for (const entry of log) {
    if (entry.step === "module_started" && entry.module) {
      activeModule = entry.module;
      const mod = moduleStates.find((m) => m.id === entry.module);
      if (mod) mod.status = "active";
      const idx = RUNTIME_MODULES.indexOf(entry.module);
      for (let i = 0; i < idx; i += 1) {
        moduleStates[i].status = "done";
      }
    }
    if (entry.step === "module_completed" && entry.module) {
      const mod = moduleStates.find((m) => m.id === entry.module);
      if (mod) mod.status = "done";
    }
    if (entry.step === "document_completed" && entry.docIndex === currentDocIndex) {
      for (const m of moduleStates) m.status = "done";
    }
  }

  if (isComplete) {
    for (const m of moduleStates) m.status = "done";
    activeModule = "eval";
  } else if (batchStatus === "processing" && currentDocEntry) {
    const active = moduleStates.find((m) => m.status === "active");
    if (active) activeModule = active.id;
    else {
      const firstPending = moduleStates.find((m) => m.status === "pending");
      if (firstPending) activeModule = firstPending.id;
    }
  }

  const startedDocs = log.filter((e) => e.step === "document_started");
  const completedDocs = new Set(
    log.filter((e) => e.step === "document_completed").map((e) => e.docIndex)
  );
  const failedDocs = new Set(
    log.filter((e) => e.step === "document_failed").map((e) => e.docIndex)
  );

  const documentQueue = startedDocs.map((entry) => {
    let status = "queued";
    if (completedDocs.has(entry.docIndex)) status = "completed";
    else if (failedDocs.has(entry.docIndex)) status = "failed";
    else if (entry.docIndex === currentDocIndex && !isComplete) status = "processing";

    return {
      docIndex: entry.docIndex,
      docKey: entry.docKey ?? `doc-${String(entry.docIndex).padStart(3, "0")}`,
      name: entry.originalName ?? entry.storedName ?? `Document ${entry.docIndex}`,
      status,
      steps: deriveDocSteps(log, entry.docIndex)
    };
  });

  for (const upload of uploads) {
    if (!documentQueue.some((d) => d.name === upload)) {
      documentQueue.push({
        docIndex: documentQueue.length + 1,
        name: upload,
        status: "queued",
        steps: deriveDocSteps([], null)
      });
    }
  }

  const successCount =
    lastEntry.processedCount ??
    log.filter((e) => e.step === "document_completed").length;
  const failedCount =
    lastEntry.failedCount ?? log.filter((e) => e.step === "document_failed").length;

  return {
    status: batchStatus,
    activeModule,
    moduleStates,
    documentQueue,
    processedCount: successCount,
    failedCount,
    totalCount: lastEntry.totalCount ?? (documentQueue.length || uploads.length),
    currentStep: lastEntry.step ?? "pending",
    currentDocument: currentDocEntry?.originalName ?? null
  };
}

export { RUNTIME_MODULES };
