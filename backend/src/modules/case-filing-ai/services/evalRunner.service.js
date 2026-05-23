import {
  arrayMatchScore,
  collectTextBlob,
  normalizeText,
  normalizedEquals,
  normalizedIncludes
} from "../utils/evalNormalize.js";
import { attachRunMetadataToReport } from "../utils/runMetadata.js";
import { attachEvalProvenance } from "../utils/evalProvenance.js";
import { runRuleAuthorityChecks } from "../utils/runRuleAuthorityChecks.js";
import { runParsedDocumentChecks } from "../utils/runParsedDocumentChecks.js";

function roundScore(value) {
  return Math.round(value * 100) / 100;
}

function overallStatus(scores, criticalFailures) {
  if (criticalFailures.length > 0) return "fail";
  const values = Object.values(scores).filter((v) => typeof v === "number");
  if (!values.length) return "partial";
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (min >= 0.8 && avg >= 0.85) return "pass";
  if (min >= 0.5 || avg >= 0.6) return "partial";
  return "fail";
}

function fieldResult(field, expected, actual, pass, note) {
  return { field, expected, actual, pass, note: note ?? null };
}

function taskText(task) {
  if (typeof task === "string") return task;
  return [task.taskType, task.taskDescription, task.description, task.type]
    .filter(Boolean)
    .join(" ");
}

function partyText(party) {
  if (typeof party === "string") return party;
  return [party.role, party.name, party.relationship].filter(Boolean).join(" ");
}

function deadlineText(deadline) {
  if (typeof deadline === "string") return deadline;
  return [deadline.type, deadline.description, deadline.date, deadline.deadline]
    .filter(Boolean)
    .join(" ");
}

function reviewText(item) {
  if (typeof item === "string") return item;
  return [item.issue, item.reason, item.suggestedAction].filter(Boolean).join(" ");
}

function extractActualDocumentFields(actual) {
  const meta = actual.documentMetadata ?? {};
  const docket = actual.docketEntry ?? {};
  return {
    documentType:
      docket.filingType ?? meta.documentType ?? meta.title ?? actual.originalName ?? "",
    title: meta.title ?? docket.filingType ?? "",
    filingDate: docket.filingDate ?? meta.filedDate ?? meta.filingDate ?? null,
    nyscefDocNo: docket.nyscefDocNo ?? meta.nyscefDocNo ?? meta.docIndex ?? null,
    pageCount: meta.pageCount ?? null,
    parties: [...(actual.parties ?? []), ...(actual.caseUpdates?.parties ?? [])],
    tasks: actual.tasks ?? [],
    deadlines: actual.deadlines ?? [],
    humanReviewItems: actual.humanReviewItems ?? []
  };
}

function compareScalarField(field, expected, actual, fieldResults) {
  if (expected == null || expected === "") return 1;
  const pass =
    typeof expected === "number"
      ? Number(actual) === Number(expected)
      : normalizedEquals(expected, actual) || normalizedIncludes(actual, expected);
  fieldResults.push(
    fieldResult(field, expected, actual, pass, pass ? null : "value mismatch")
  );
  return pass ? 1 : 0;
}

function compareDocumentExpected(actual, expected) {
  const fields = extractActualDocumentFields(actual);
  const fieldResults = [];

  const documentIdentity =
    (compareScalarField(
      "expectedDocumentType",
      expected.expectedDocumentType,
      fields.documentType,
      fieldResults
    ) +
      compareScalarField(
        "expectedTitle",
        expected.expectedTitle,
        fields.title,
        fieldResults
      )) /
    2;

  const metadata =
    (compareScalarField(
      "expectedFilingDate",
      expected.expectedFilingDate,
      fields.filingDate,
      fieldResults
    ) +
      compareScalarField(
        "expectedNyscefDocNo",
        expected.expectedNyscefDocNo,
        fields.nyscefDocNo,
        fieldResults
      ) +
      (expected.expectedPageCount != null
        ? compareScalarField(
            "expectedPageCount",
            expected.expectedPageCount,
            fields.pageCount,
            fieldResults
          )
        : 1)) /
    (expected.expectedPageCount != null ? 3 : 2);

  const parties = arrayMatchScore(
    expected.expectedParties ?? expected.expectedConfirmedFacts ?? [],
    fields.parties,
    partyText
  );
  fieldResults.push(
    fieldResult(
      "expectedParties",
      expected.expectedParties ?? expected.expectedConfirmedFacts,
      fields.parties,
      parties >= 0.6,
      `matched ${roundScore(parties * 100)}%`
    )
  );

  const tasks = arrayMatchScore(expected.expectedTasks ?? [], fields.tasks, taskText);
  fieldResults.push(
    fieldResult(
      "expectedTasks",
      expected.expectedTasks,
      fields.tasks,
      tasks >= 0.6,
      `matched ${roundScore(tasks * 100)}%`
    )
  );

  const deadlines = arrayMatchScore(
    expected.expectedDeadlines ?? [],
    fields.deadlines,
    deadlineText
  );
  fieldResults.push(
    fieldResult(
      "expectedDeadlines",
      expected.expectedDeadlines,
      fields.deadlines,
      deadlines >= 0.6,
      `matched ${roundScore(deadlines * 100)}%`
    )
  );

  const humanReview = arrayMatchScore(
    expected.expectedHumanReviewItems ?? [],
    fields.humanReviewItems,
    reviewText
  );
  fieldResults.push(
    fieldResult(
      "expectedHumanReviewItems",
      expected.expectedHumanReviewItems,
      fields.humanReviewItems,
      humanReview >= 0.5,
      `matched ${roundScore(humanReview * 100)}%`
    )
  );

  return {
    scores: {
      documentIdentity: roundScore(documentIdentity),
      metadata: roundScore(metadata),
      parties: roundScore(parties),
      tasks: roundScore(tasks),
      deadlines: roundScore(deadlines),
      humanReview: roundScore(humanReview)
    },
    fieldResults
  };
}

function listTextItems(items) {
  if (!items?.length) return [];
  return items.map((item) => (typeof item === "string" ? item : taskText(item)));
}

function compareSnapshotExpected(actual, expected) {
  const fieldResults = [];

  const phaseScore =
    (normalizedEquals(actual.currentPhase, expected.currentPhase) ? 1 : 0) * 0.5 +
    (normalizedEquals(actual.currentMiniPhase, expected.currentMiniPhase) ? 1 : 0) * 0.5;
  fieldResults.push(
    fieldResult("currentPhase", expected.currentPhase, actual.currentPhase, phaseScore >= 0.5)
  );
  fieldResults.push(
    fieldResult(
      "currentMiniPhase",
      expected.currentMiniPhase,
      actual.currentMiniPhase,
      normalizedEquals(actual.currentMiniPhase, expected.currentMiniPhase)
    )
  );

  const confirmedFacts = arrayMatchScore(
    expected.confirmedFacts ?? [],
    actual.confirmedFacts ?? [],
    (item) => String(item)
  );
  const openTasks = arrayMatchScore(
    listTextItems(expected.openTasks),
    listTextItems(actual.openTasks),
    (item) => String(item)
  );
  const completedTasks = arrayMatchScore(
    listTextItems(expected.completedTasks),
    listTextItems(actual.completedTasks),
    (item) => String(item)
  );
  const deadlines = arrayMatchScore(
    expected.deadlines ?? [],
    actual.deadlines ?? [],
    deadlineText
  );
  const superseded = arrayMatchScore(
    expected.supersededDeadlines ?? [],
    actual.supersededDeadlines ?? [],
    deadlineText
  );
  const reviewItems = arrayMatchScore(
    expected.unresolvedHumanReviewItemsExpected ??
      expected.unresolvedHumanReviewItems ??
      [],
    actual.unresolvedHumanReviewItems ?? [],
    reviewText
  );
  const conflicts = arrayMatchScore(
    expected.conflicts ?? [],
    actual.conflicts ?? [],
    (item) => String(item)
  );

  const snapshot =
    (phaseScore +
      confirmedFacts +
      openTasks +
      completedTasks +
      deadlines +
      superseded +
      reviewItems +
      conflicts) /
    8;

  return {
    scores: { snapshot: roundScore(snapshot) },
    fieldResults: [
      ...fieldResults,
      fieldResult("confirmedFacts", expected.confirmedFacts, actual.confirmedFacts, confirmedFacts >= 0.5),
      fieldResult("openTasks", expected.openTasks, actual.openTasks, openTasks >= 0.5),
      fieldResult("completedTasks", expected.completedTasks, actual.completedTasks, completedTasks >= 0.5),
      fieldResult("deadlines", expected.deadlines, actual.deadlines, deadlines >= 0.5),
      fieldResult(
        "supersededDeadlines",
        expected.supersededDeadlines,
        actual.supersededDeadlines,
        superseded >= 0.5
      )
    ]
  };
}

function runMustNotCreateChecks(actual, expected, docIndex) {
  const failures = [];
  const blob = collectTextBlob(actual);
  const mustNot = expected.mustNotCreate ?? [];

  for (const rule of mustNot) {
    if (normalizedIncludes(blob, rule)) {
      failures.push(`mustNotCreate violated: ${rule}`);
    }
  }

  if (docIndex === 1) {
    const hasAnswerDeadline =
      /answer|appearance/i.test(blob) &&
      /2025[- ]05[- ]2[06]|twenty days|30 days|deadline/i.test(blob) &&
      !/verify service|needs_source_trigger|needs review/i.test(blob);
    if (hasAnswerDeadline) {
      failures.push(
        "Created final answer deadline without verified service date/method"
      );
    }
  }

  if (docIndex === 2) {
    if (/respond to certificate of merit|response deadline to certificate of merit/i.test(blob)) {
      failures.push("Created deadline for defendant to respond to Certificate of Merit");
    }
  }

  if (docIndex <= 4) {
    const noticeCompleted =
      /notice of claim.*completed|completed.*notice of claim|filed notice of claim/i.test(blob) &&
      docIndex < 3;
    if (noticeCompleted) {
      failures.push("Marked notice of claim completed without specific source support");
    }
  }

  if (docIndex === 8) {
    const fixedDeposition =
      /deposition.*\d{4}-\d{2}-\d{2}/i.test(blob) &&
      /agreed|court directed|to be agreed|schedule/i.test(blob);
    if (fixedDeposition) {
      failures.push(
        "Created fixed deposition date when notice indicates date/time/location to be agreed or court-directed"
      );
    }
  }

  return failures;
}

function runNegativeGuardrails({
  actualDoc,
  docIndex,
  snapshot,
  allDocumentOutputs,
  guardrails
}) {
  const failures = [];
  const docBlob = collectTextBlob(actualDoc);
  const snapshotBlob = collectTextBlob(snapshot);
  const allBlob = collectTextBlob(allDocumentOutputs);

  for (const rule of guardrails ?? []) {
    const appliesToDocs = rule.appliesToDocs;
    if (appliesToDocs?.length && !appliesToDocs.includes(docIndex)) {
      continue;
    }
    if (rule.appliesAfterDoc != null && docIndex < rule.appliesAfterDoc) {
      continue;
    }

    if (rule.id === "no_answer_deadline_from_filing_date" && docIndex === 1) {
      if (
        /answer|appearance/i.test(docBlob) &&
        /2025[- ]05[- ]0?6/i.test(docBlob) &&
        !/verify service|needs_source_trigger/i.test(docBlob)
      ) {
        failures.push(rule.description);
      }
    }

    if (rule.id === "no_certificate_of_merit_response_deadline") {
      for (const phrase of rule.failIfTextIncludes ?? []) {
        if (normalizedIncludes(docBlob, phrase)) {
          failures.push(rule.description);
        }
      }
    }

    if (rule.id === "no_completed_notice_of_claim_without_source") {
      const completedNotice =
        /notice of claim/i.test(docBlob) &&
        (/completed|filed notice of claim|timely via court order/i.test(docBlob) ||
          /status.*completed/i.test(docBlob));
      if (completedNotice && docIndex < 3) {
        failures.push(rule.description);
      }
    }

    if (rule.id === "no_fixed_deposition_date_without_actual_date" && docIndex === 8) {
      if (
        /deposition/i.test(docBlob) &&
        /\d{4}-\d{2}-\d{2}/.test(docBlob) &&
        /agreed|court directed|to be agreed/i.test(docBlob)
      ) {
        failures.push(rule.description);
      }
    }

    if (rule.id === "supersede_old_noi_after_cc_order" && docIndex >= 13) {
      const hasNewNoi = /2026[- ]12[- ]10/.test(snapshotBlob) || /2026[- ]12[- ]10/.test(allBlob);
      const oldStillActive =
        /2026[- ]08[- ]13/.test(snapshotBlob) &&
        !/supersed|superseded/i.test(snapshotBlob) &&
        hasNewNoi;
      if (oldStillActive) {
        failures.push(
          "Old NOI date 2026-08-13 still active after 2026-12-10 appears in CC order"
        );
      }
    }

    if (rule.id === "no_duplicate_doc_014_tasks" && docIndex === 14) {
      const doc13 = allDocumentOutputs.find((d) => d.docIndex === 13);
      if (doc13) {
        const doc13TaskCount = (doc13.tasks ?? []).length;
        const doc14TaskCount = (actualDoc.tasks ?? []).length;
        if (doc14TaskCount >= doc13TaskCount && doc14TaskCount > 3) {
          failures.push(rule.description);
        }
      }
    }
  }

  return [...new Set(failures)];
}

function buildBaseReport({ evalId, batchId, docKey, caseId, type }) {
  return {
    evalId,
    batchId,
    docKey: docKey ?? null,
    caseId,
    type,
    status: "pass",
    scores: {},
    criticalFailures: [],
    fieldResults: [],
    notes: []
  };
}

export function createEvalRunnerService({ goldenDataset, storagePaths }) {
  async function evalDocument({
    batchId,
    docIndex,
    docKey,
    documentResult,
    snapshot,
    allDocumentOutputs = [],
    runMetadata
  }) {
    const evalId = goldenDataset.docEvalId(docIndex);
    const report = buildBaseReport({
      evalId,
      batchId,
      docKey: docKey ?? documentResult.docKey,
      caseId: goldenDataset.caseId,
      type: "document"
    });

    let expected;
    try {
      expected = await goldenDataset.loadDocumentExpected(docIndex);
    } catch {
      report.status = "fail";
      report.notes.push(`No golden expected file for ${evalId}`);
      return report;
    }

    const { scores, fieldResults } = compareDocumentExpected(documentResult, expected);
    report.scores = { ...scores, snapshot: 0, negativeGuardrails: 1 };
    report.fieldResults = fieldResults;

    const mustNotFailures = runMustNotCreateChecks(documentResult, expected, docIndex);
    const guardrails = await goldenDataset.loadNegativeGuardrails();
    const guardrailFailures = runNegativeGuardrails({
      actualDoc: documentResult,
      docIndex,
      snapshot,
      allDocumentOutputs,
      guardrails
    });

    const ruleAuthorityFailures = runRuleAuthorityChecks({
      actualDoc: documentResult,
      snapshot,
      rankedRules: documentResult.rankedRules ?? [],
      docIndex
    });
    report.ruleAuthorityFailures = ruleAuthorityFailures;
    report.scores.ruleAuthority = ruleAuthorityFailures.length === 0 ? 1 : 0;

    let parsedGoldenFailures = [];
    if (storagePaths) {
      parsedGoldenFailures = await runParsedDocumentChecks({
        batchId,
        docIndex,
        storagePaths,
        goldenDataset
      });
    }
    report.parsedGoldenFailures = parsedGoldenFailures;
    report.scores.parsedGolden = parsedGoldenFailures.length === 0 ? 1 : 0;

    report.criticalFailures = [
      ...mustNotFailures,
      ...guardrailFailures,
      ...ruleAuthorityFailures.map((f) => f.message),
      ...parsedGoldenFailures.map((f) => f.message)
    ];
    if (guardrailFailures.length > 0 || mustNotFailures.length > 0) {
      report.scores.negativeGuardrails = 0;
    }

    report.status = overallStatus(report.scores, report.criticalFailures);
    report.notes.push(
      `Compared against evals/golden/${goldenDataset.caseId}/${evalId}.expected.json`
    );
    attachRunMetadataToReport(report, runMetadata ?? documentResult?.runMetadata);
    attachEvalProvenance(report, documentResult);
    return report;
  }

  async function evalSnapshot({
    batchId,
    docIndex,
    snapshot,
    allDocumentOutputs = [],
    runMetadata
  }) {
    const evalId = goldenDataset.snapshotEvalId(docIndex);
    const report = buildBaseReport({
      evalId,
      batchId,
      docKey: null,
      caseId: goldenDataset.caseId,
      type: "snapshot"
    });

    if (!goldenDataset.hasSnapshotCheckpoint(docIndex)) {
      report.notes.push(`No snapshot checkpoint for doc ${docIndex}`);
      report.status = "partial";
      return report;
    }

    let expected;
    try {
      expected = await goldenDataset.loadSnapshotExpected(docIndex);
    } catch {
      report.status = "fail";
      report.notes.push(`Missing ${evalId}.expected.json`);
      return report;
    }

    const { scores, fieldResults } = compareSnapshotExpected(snapshot, expected);
    report.scores = {
      documentIdentity: 0,
      metadata: 0,
      parties: 0,
      tasks: 0,
      deadlines: 0,
      humanReview: 0,
      snapshot: scores.snapshot,
      negativeGuardrails: 1
    };
    report.fieldResults = fieldResults;

    const guardrails = await goldenDataset.loadNegativeGuardrails();
    const guardrailFailures = runNegativeGuardrails({
      actualDoc: {},
      docIndex,
      snapshot,
      allDocumentOutputs,
      guardrails
    });
    report.criticalFailures = guardrailFailures;
    if (guardrailFailures.length > 0) {
      report.scores.negativeGuardrails = 0;
    }

    report.status = overallStatus(report.scores, report.criticalFailures);
    report.notes.push(`Compared case-snapshot.json against ${evalId}.expected.json`);
    attachRunMetadataToReport(report, runMetadata);
    return report;
  }

  async function runAfterDocument({
    batchId,
    docIndex,
    docKey,
    documentResult,
    snapshot,
    allDocumentOutputs,
    runMetadata
  }) {
    const effectiveRunMetadata = runMetadata ?? documentResult?.runMetadata;
    const reports = [];
    const docReport = await evalDocument({
      batchId,
      docIndex,
      docKey,
      documentResult,
      snapshot,
      allDocumentOutputs,
      runMetadata: effectiveRunMetadata
    });
    reports.push({ evalId: docReport.evalId, report: docReport });

    if (goldenDataset.hasSnapshotCheckpoint(docIndex)) {
      const snapReport = await evalSnapshot({
        batchId,
        docIndex,
        snapshot,
        allDocumentOutputs,
        runMetadata: effectiveRunMetadata
      });
      reports.push({ evalId: snapReport.evalId, report: snapReport });
    }

    return reports;
  }

  return {
    evalDocument,
    evalSnapshot,
    runAfterDocument
  };
}
