/**
 * Maps case-filing-demo bundle JSON → Legal Ops dashboard / worklog shapes
 * (compatible with imported litigation_workflow Patch 07B/07E UI).
 */

const STAGE_LABELS = {
  upload_received: "Intake",
  parse_completed: "Parse & OCR",
  rules_matched: "Court rules",
  prompt_completed: "AI extraction",
  snapshot_merged: "Case snapshot",
  eval_scored: "Golden eval"
};

const STAGE_OWNER = {
  upload_received: "Staff",
  parse_completed: "Parse agent",
  rules_matched: "Rules engine",
  prompt_completed: "Master prompt (LLM)",
  snapshot_merged: "Snapshot merge",
  eval_scored: "Eval agent"
};

/** Minutes — synthetic manual baseline per stage (non-technical benchmark). */
const MANUAL_MINUTES_BY_EVENT = {
  upload_received: 3,
  parse_completed: 12,
  rules_matched: 10,
  prompt_completed: 28,
  snapshot_merged: 6,
  eval_scored: 8
};

const AUTO_MINUTES_BY_EVENT = {
  upload_received: 0.5,
  parse_completed: 2,
  rules_matched: 1.5,
  prompt_completed: 4,
  snapshot_merged: 0.5,
  eval_scored: 1
};

const COST_PER_MINUTE_STAFF = 1.25;
const COST_PER_MINUTE_ATTORNEY = 4.5;

function minutesLabel(n) {
  const v = Number(n || 0);
  if (v >= 60) {
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(v)}m`;
}

function money(n) {
  return `$${Math.round(Number(n || 0)).toLocaleString()}`;
}

function getHybrid(bundle, playback, pick) {
  if (!playback || playback.playStatus === "idle" || playback.playStatus === "complete") {
    return pick.full;
  }
  return pick.live;
}

export function resolveDemoData(bundle, playback) {
  const outputs = getHybrid(bundle, playback, {
    full: bundle?.results?.documents ?? [],
    live: playback?.revealedOutputs ?? []
  });
  const reports = getHybrid(bundle, playback, {
    full: bundle?.evals?.reports ?? [],
    live: playback?.visibleEvalReports ?? []
  });
  const audit = getHybrid(bundle, playback, {
    full: bundle?.audit?.entries ?? [],
    live: playback?.liveAudit ?? []
  });
  const snapshot = bundle?.results?.caseSnapshot ?? {};
  const caseMeta = bundle?.case ?? {};
  return { outputs, reports, audit, snapshot, caseMeta };
}

function evalStatusForDoc(docIndex, reports) {
  const docReport = reports.find(
    (r) => r.type === "document" && (r.docIndex === docIndex || r.evalId === `doc_${String(docIndex).padStart(3, "0")}`)
  );
  return docReport?.status ?? "pending";
}

export function mapToFilingTable(bundle, playback, caseDetail) {
  const { outputs, reports } = resolveDemoData(bundle, playback);
  const docs = caseDetail?.documents ?? [];

  return outputs.map((doc) => {
    const meta = docs.find((d) => d.docKey === doc.docKey) ?? {};
    return {
      docIndex: doc.docIndex,
      docKey: doc.docKey,
      title: meta.title ?? doc.documentMetadata?.title ?? doc.originalName,
      documentType: meta.documentType ?? doc.docketEntry?.filingType ?? "",
      filingDate: meta.filingDate ?? doc.docketEntry?.filingDate ?? "",
      nyscefDocNo: meta.nyscefDocNo ?? doc.docketEntry?.nyscefDocNo ?? doc.docIndex,
      pageCount: meta.pageCount ?? doc.documentMetadata?.pageCount ?? "",
      evalStatus: evalStatusForDoc(doc.docIndex, reports),
      tasksCount: (doc.tasks ?? []).length,
      deadlinesCount: (doc.deadlines ?? []).length,
      rulesCount: (doc.ruleSourcesChecked ?? doc.ruleSourcesApplied ?? []).length,
      pdfUrl: meta.source?.url ?? null
    };
  });
}

export function mapToBenchmark(bundle, playback) {
  const { outputs, reports, audit } = resolveDemoData(bundle, playback);
  const evalSummary = reports.reduce(
    (s, r) => {
      if (r.status === "pass") s.pass += 1;
      else if (r.status === "partial") s.partial += 1;
      else if (r.status === "fail") s.fail += 1;
      return s;
    },
    { pass: 0, partial: 0, fail: 0 }
  );

  const stages = Object.keys(STAGE_LABELS).map((event) => {
    const count = audit.filter((e) => e.event === event).length;
    const manual = MANUAL_MINUTES_BY_EVENT[event] * Math.max(count, 1);
    const auto = AUTO_MINUTES_BY_EVENT[event] * Math.max(count, 1);
    return {
      id: event,
      label: STAGE_LABELS[event],
      filingsTouched: count,
      manualMinutes: manual,
      automatedMinutes: auto,
      savedMinutes: Math.max(0, manual - auto)
    };
  });

  const manualTotal = stages.reduce((s, row) => s + row.manualMinutes, 0);
  const autoTotal = stages.reduce((s, row) => s + row.automatedMinutes, 0);
  const savedTotal = manualTotal - autoTotal;

  return {
    documentCount: outputs.length,
    evalSummary,
    stages,
    manualTotal,
    autoTotal,
    savedTotal,
    savedCostStaff: savedTotal * COST_PER_MINUTE_STAFF,
    savedCostBlended: savedTotal * ((COST_PER_MINUTE_STAFF + COST_PER_MINUTE_ATTORNEY) / 2),
    authorModel: bundle?.manifest?.lineage?.authorModel ?? "—",
    goldenCaseId: bundle?.manifest?.lineage?.goldenCaseId ?? "—"
  };
}

export function mapToChartData(bundle, playback) {
  const benchmark = mapToBenchmark(bundle, playback);
  const { reports } = resolveDemoData(bundle, playback);

  const evalPie = [
    { name: "Pass", value: benchmark.evalSummary.pass, fill: "#3d9a6a" },
    { name: "Partial", value: benchmark.evalSummary.partial, fill: "#c9a227" },
    { name: "Fail", value: benchmark.evalSummary.fail, fill: "#c94c4c" }
  ].filter((d) => d.value > 0);

  const stageBars = benchmark.stages.map((s) => ({
    name: s.label.split(" ")[0],
    manual: s.manualMinutes,
    automated: s.automatedMinutes
  }));

  const moduleTime = {};
  for (const report of reports) {
    if (report.type !== "document") continue;
    const key = "Eval";
    moduleTime[key] = (moduleTime[key] || 0) + 1;
  }
  for (const row of benchmark.stages) {
    moduleTime[row.label] = row.automatedMinutes;
  }

  return { evalPie, stageBars, moduleTime };
}

export function mapToDashboard(bundle, playback, caseDetail) {
  const benchmark = mapToBenchmark(bundle, playback);
  const { snapshot, caseMeta } = resolveDemoData(bundle, playback);
  const identity = caseMeta.caseIdentity ?? caseDetail?.caseIdentity ?? {};

  return {
    generatedAt: bundle?.generatedAt ?? new Date().toISOString(),
    caseId: caseDetail?.id ?? bundle?.manifest?.lineage?.goldenCaseId,
    caption: identity.caseName ?? caseDetail?.title,
    indexNumber: identity.indexNumber ?? "—",
    summary: {
      documentsProcessed: benchmark.documentCount,
      evalPass: benchmark.evalSummary.pass,
      evalPartial: benchmark.evalSummary.partial,
      evalFail: benchmark.evalSummary.fail,
      openTasks: (snapshot.openTasks ?? []).length,
      deadlines: (snapshot.deadlines ?? []).length,
      estimatedMinutesSaved: benchmark.savedTotal
    },
    metrics: [
      {
        metricId: "documents",
        label: "Filings processed",
        value: benchmark.documentCount,
        unit: "count",
        category: "throughput"
      },
      {
        metricId: "minutes_saved",
        label: "Est. minutes saved",
        value: benchmark.savedTotal,
        unit: "minutes",
        category: "time_savings"
      },
      {
        metricId: "cost_saved",
        label: "Est. cost saved",
        value: benchmark.savedCostBlended,
        unit: "currency",
        category: "money_savings"
      },
      {
        metricId: "eval_pass",
        label: "Golden eval pass",
        value: benchmark.evalSummary.pass,
        unit: "count",
        category: "quality"
      }
    ],
    savings: {
      attorneyMinutesSaved: Math.round(benchmark.savedTotal * 0.35),
      staffMinutesSaved: Math.round(benchmark.savedTotal * 0.65),
      estimatedCostSaved: benchmark.savedCostBlended
    },
    bottlenecks: [
      {
        phaseId: "master-prompt",
        activityCount: benchmark.documentCount,
        reason: "LLM extraction is the longest automated stage per filing."
      }
    ],
    recommendations: [
      {
        title: "Review human-review queue",
        reason: "Synthetic demo surfaces items attorneys should confirm before calendar entry.",
        suggestedAction: "Open Outputs tab for per-filing tasks and deadlines."
      },
      {
        title: "Compare to golden dataset",
        reason: "Eval agent scores each filing against committed expected JSON.",
        suggestedAction: "See Evals and Benchmark tabs for pass/partial/fail breakdown."
      }
    ]
  };
}

export function mapToWorklogPayload(bundle, playback, caseDetail) {
  const { audit, outputs } = resolveDemoData(bundle, playback);
  const rows = [];

  for (const entry of audit) {
    const event = entry.event;
    if (!STAGE_LABELS[event]) continue;
    const manual = MANUAL_MINUTES_BY_EVENT[event] ?? 5;
    const auto = AUTO_MINUTES_BY_EVENT[event] ?? 2;
    rows.push({
      phaseId: "case_filing_ai",
      miniPhaseCode: entry.docIndex ? `doc_${String(entry.docIndex).padStart(3, "0")}` : "batch",
      taskTitle: `${STAGE_LABELS[event]} — ${entry.docKey ?? "batch"}`,
      ownerRole: STAGE_OWNER[event] ?? "System",
      taskType: event,
      status: "completed",
      startedAt: entry.timestamp,
      endedAt: entry.timestamp,
      activeMinutes: auto,
      waitingMinutes: 0,
      manualBaselineMinutes: manual,
      automatedEstimateMinutes: auto,
      estimatedMinutesSaved: Math.max(0, manual - auto),
      frictionTags: entry.replay ? [] : ["live"],
      sourceDocumentId: entry.docKey ?? "",
      sourceFileName: entry.docKey ? `${entry.docKey}.pdf` : ""
    });
  }

  const durations = Object.entries(STAGE_LABELS).map(([event, label]) => {
    const count = audit.filter((e) => e.event === event).length;
    const manual = (MANUAL_MINUTES_BY_EVENT[event] ?? 5) * Math.max(count, 1);
    const auto = (AUTO_MINUTES_BY_EVENT[event] ?? 2) * Math.max(count, 1);
    return {
      miniPhaseCode: event,
      label,
      filingCount: count,
      manualBaselineMinutes: manual,
      automatedEstimateMinutes: auto,
      estimatedMinutesSaved: Math.max(0, manual - auto)
    };
  });

  const activeMinutes = rows.reduce((s, r) => s + Number(r.activeMinutes || 0), 0);
  const savedMinutes = rows.reduce((s, r) => s + Number(r.estimatedMinutesSaved || 0), 0);

  return {
    worklog: { worklog: rows },
    durations: { durationEstimates: durations },
    qa: {
      qaReport: {
        ok: outputs.length > 0,
        checks: {
          worklogRows: rows.length,
          miniPhasesCovered: durations.length,
          durationRows: durations.length
        },
        failures: [],
        warnings: rows.length < outputs.length * 4 ? ["Some audit stages not yet replayed."] : []
      }
    },
    summary: {
      taskCount: rows.length,
      activeMinutes,
      savedMinutes,
      documentCount: outputs.length
    },
    caseLabel: caseDetail?.title ?? bundle?.case?.title
  };
}

export function mapToDeadlineTable(bundle) {
  const snapshot = bundle?.results?.caseSnapshot ?? {};
  return (snapshot.deadlines ?? []).map((d, i) => ({
    id: `dl-${i}`,
    type: d.type ?? d.deadlineType ?? "Deadline",
    date: d.date ?? d.dueDate ?? "",
    sourceAuthority: d.sourceAuthority ?? d.authority ?? "",
    status: d.status ?? "open"
  }));
}

export function mapToTaskTable(bundle) {
  const snapshot = bundle?.results?.caseSnapshot ?? {};
  return (snapshot.openTasks ?? []).map((t, i) => {
    if (typeof t === "string") {
      return { id: `task-${i}`, description: t, status: "open", source: "" };
    }
    return {
      id: `task-${i}`,
      description: t.taskDescription ?? t.description ?? t.taskType ?? "",
      status: t.status ?? "open",
      source: t.sourceAuthority ?? ""
    };
  });
}

export { minutesLabel, money };
