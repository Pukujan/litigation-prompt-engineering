import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const RUNTIME_MODULES = [
  "part-rules",
  "parse",
  "court-rules",
  "master-prompt",
  "snapshot",
  "eval"
];

const MODULE_META = {
  "part-rules": { displayName: "Part rules", icon: "📋" },
  parse: { displayName: "Parse & text", icon: "📄" },
  "court-rules": { displayName: "Court rules", icon: "⚖️" },
  "master-prompt": { displayName: "Extraction (LLM)", icon: "✨" },
  snapshot: { displayName: "Case snapshot", icon: "📊" },
  eval: { displayName: "Golden eval", icon: "✓" }
};

const DOC_STEPS = ["parse", "rules", "extract", "snapshot", "eval"];

const PER_DOC_MODULES = ["parse", "court-rules", "master-prompt", "snapshot", "eval"];

const STEP_MESSAGES = {
  "part-rules": "Part rules context prepared for the synthetic Queens med-mal sequence.",
  parse: "PDF text extracted; OCR routing applied when the filing requires visual review.",
  "court-rules": "Court-rule and case-order authority candidates ranked for this filing.",
  "master-prompt": "Master prompt produced tasks, deadlines, parties, and review items.",
  snapshot: "Rolling case snapshot merged with document-level guardrails.",
  eval: "Golden eval scored against the synthetic expected output."
};

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

function buildInitialQueue(documents) {
  return documents.map((doc) => ({
    docIndex: doc.docIndex,
    docKey: doc.docKey,
    name: doc.title,
    status: "queued",
    steps: Object.fromEntries(DOC_STEPS.map((step) => [step, "pending"]))
  }));
}

function buildModuleStates(activeModuleId, completedThroughIndex) {
  const activeIndex = RUNTIME_MODULES.indexOf(activeModuleId);
  return RUNTIME_MODULES.map((id, index) => {
    if (index < completedThroughIndex) return { id, status: "done", ...MODULE_META[id] };
    if (id === activeModuleId) return { id, status: "active", ...MODULE_META[id] };
    return { id, status: "pending", ...MODULE_META[id] };
  });
}

function docStepKey(moduleId) {
  if (moduleId === "court-rules") return "rules";
  if (moduleId === "master-prompt") return "extract";
  return moduleId;
}

export function useInteractiveDemoPlayback({ bundle, caseDetail, speed = 1, onComplete }) {
  const [playStatus, setPlayStatus] = useState("idle");
  const [activeModule, setActiveModule] = useState("part-rules");
  const [moduleStates, setModuleStates] = useState(() =>
    buildModuleStates("part-rules", 0)
  );
  const [documentQueue, setDocumentQueue] = useState([]);
  const [activeDocIndex, setActiveDocIndex] = useState(null);
  const [revealedOutputs, setRevealedOutputs] = useState([]);
  const [revealedEvalIds, setRevealedEvalIds] = useState([]);
  const [liveAudit, setLiveAudit] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const abortRef = useRef(null);
  const outputsByKey = useMemo(() => {
    const map = new Map();
    for (const doc of bundle?.results?.documents ?? []) {
      map.set(doc.docKey, doc);
    }
    return map;
  }, [bundle]);

  const evalByDocIndex = useMemo(() => {
    const map = new Map();
    for (const report of bundle?.evals?.reports ?? []) {
      const match = report.evalId?.match(/doc_(\d+)/);
      if (match) map.set(Number(match[1]), report);
    }
    return map;
  }, [bundle]);

  const documents = caseDetail?.documents ?? [];
  const totalSteps = useMemo(
    () => 1 + documents.length * PER_DOC_MODULES.length,
    [documents.length]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPlayStatus("idle");
    setActiveModule("part-rules");
    setModuleStates(buildModuleStates("part-rules", 0));
    setDocumentQueue(buildInitialQueue(documents));
    setActiveDocIndex(null);
    setRevealedOutputs([]);
    setRevealedEvalIds([]);
    setLiveAudit([]);
    setCurrentMessage("");
    setProgress({ current: 0, total: totalSteps });
  }, [documents, totalSteps]);

  useEffect(() => {
    reset();
  }, [bundle, caseDetail, reset]);

  const pushAudit = useCallback((entry) => {
    setLiveAudit((prev) => [...prev.slice(-24), entry]);
  }, []);

  const runPlayback = useCallback(async () => {
    if (!bundle || !documents.length) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setPlayStatus("playing");
    setRevealedOutputs([]);
    setRevealedEvalIds([]);
    setLiveAudit([]);
    setDocumentQueue(buildInitialQueue(documents));

    let stepCounter = 0;
    const delay = (base) => sleep(Math.round(base / speed), signal);

    try {
      setActiveModule("part-rules");
      setModuleStates(buildModuleStates("part-rules", 0));
      setCurrentMessage(STEP_MESSAGES["part-rules"]);
      pushAudit({
        event: "batch_started",
        message: STEP_MESSAGES["part-rules"],
        docKey: null
      });
      await delay(900);
      stepCounter += 1;
      setProgress({ current: stepCounter, total: totalSteps });
      setModuleStates(buildModuleStates("parse", 1));

      for (const doc of documents) {
        const docIndex = doc.docIndex;
        const docKey = doc.docKey;

        setActiveDocIndex(docIndex);
        setDocumentQueue((queue) =>
          queue.map((row) =>
            row.docKey === docKey
              ? { ...row, status: "processing" }
              : row
          )
        );

        pushAudit({
          event: "document_started",
          docKey,
          docIndex,
          message: `Processing ${doc.title}`
        });
        await delay(500);

        for (const moduleId of PER_DOC_MODULES) {
          if (signal.aborted) return;

          const stepKey = docStepKey(moduleId);
          const moduleIndex = RUNTIME_MODULES.indexOf(moduleId);

          setActiveModule(moduleId);
          setModuleStates(buildModuleStates(moduleId, moduleIndex));
          setCurrentMessage(`${MODULE_META[moduleId].displayName}: ${doc.title}`);
          setDocumentQueue((queue) =>
            queue.map((row) => {
              if (row.docKey !== docKey) return row;
              const steps = { ...row.steps };
              for (const key of DOC_STEPS) {
                if (key === stepKey) steps[key] = "active";
                else if (steps[key] === "active") steps[key] = "done";
              }
              return { ...row, steps };
            })
          );

          pushAudit({
            event: `${stepKey}_running`,
            module: moduleId,
            docKey,
            docIndex,
            message: STEP_MESSAGES[moduleId]
          });

          await delay(moduleId === "master-prompt" ? 1200 : 850);

          setDocumentQueue((queue) =>
            queue.map((row) => {
              if (row.docKey !== docKey) return row;
              return {
                ...row,
                steps: { ...row.steps, [stepKey]: "done" }
              };
            })
          );

          if (moduleId === "master-prompt") {
            const output = outputsByKey.get(docKey);
            if (output) {
              setRevealedOutputs((prev) =>
                prev.some((item) => item.docKey === docKey) ? prev : [...prev, output]
              );
            }
          }

          if (moduleId === "eval") {
            const evalReport = evalByDocIndex.get(docIndex);
            if (evalReport) {
              setRevealedEvalIds((prev) =>
                prev.includes(evalReport.evalId) ? prev : [...prev, evalReport.evalId]
              );
            }
            pushAudit({
              event: "eval_scored",
              module: moduleId,
              docKey,
              docIndex,
              message: `Eval ${evalReport?.status ?? "scored"} for ${doc.title}`
            });
          }

          stepCounter += 1;
          setProgress({ current: stepCounter, total: totalSteps });
        }

        setDocumentQueue((queue) =>
          queue.map((row) =>
            row.docKey === docKey ? { ...row, status: "completed" } : row
          )
        );
        pushAudit({
          event: "document_completed",
          docKey,
          docIndex,
          message: `Completed ${doc.title}`
        });
        await delay(400);
      }

      setActiveModule("eval");
      setModuleStates(buildModuleStates("eval", RUNTIME_MODULES.length));
      setCurrentMessage("Batch complete. Governance bundle ready for review.");
      pushAudit({
        event: "batch_completed",
        message: "All synthetic filings processed through the multi-agent pipeline."
      });
      setPlayStatus("complete");
      onComplete?.();
    } catch (error) {
      if (error?.name === "AbortError") return;
      setPlayStatus("idle");
      throw error;
    }
  }, [
    bundle,
    documents,
    evalByDocIndex,
    outputsByKey,
    pushAudit,
    speed,
    totalSteps,
    onComplete
  ]);

  const start = useCallback(() => {
    runPlayback().catch(() => {
      setPlayStatus("idle");
    });
  }, [runPlayback]);

  const pause = useCallback(() => {
    abortRef.current?.abort();
    setPlayStatus("paused");
  }, []);

  const visibleEvalReports = useMemo(() => {
    const reports = bundle?.evals?.reports ?? [];
    return reports.filter((report) => revealedEvalIds.includes(report.evalId));
  }, [bundle, revealedEvalIds]);

  const activeDocument =
    documents.find((doc) => doc.docIndex === activeDocIndex) ?? null;
  const activeOutput = activeDocument
    ? outputsByKey.get(activeDocument.docKey) ?? null
    : null;
  const activeEval = activeDocIndex != null ? evalByDocIndex.get(activeDocIndex) : null;

  return {
    playStatus,
    start,
    pause,
    reset,
    activeModule,
    moduleStates,
    documentQueue,
    activeDocument,
    activeOutput,
    activeEval,
    revealedOutputs,
    visibleEvalReports,
    liveAudit,
    currentMessage,
    progress,
    canStart: Boolean(bundle && documents.length) && playStatus !== "playing"
  };
}
