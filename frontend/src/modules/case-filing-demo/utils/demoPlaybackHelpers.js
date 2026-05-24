export function isLivePlayback(playback) {
  return playback?.playStatus === "playing";
}

export function isPlaybackComplete(playback) {
  return playback?.playStatus === "complete";
}

function isIdle(playback) {
  return !playback || playback.playStatus === "idle";
}

export function useHybridEvalReports(bundle, playback) {
  if (isIdle(playback) || isPlaybackComplete(playback)) {
    return bundle?.evals?.reports ?? [];
  }
  return playback.visibleEvalReports ?? [];
}

export function useHybridOutputs(bundle, playback) {
  if (isIdle(playback) || isPlaybackComplete(playback)) {
    return bundle?.results?.documents ?? [];
  }
  return playback.revealedOutputs ?? [];
}

export function useHybridAuditEntries(bundle, playback) {
  if (isIdle(playback) || isPlaybackComplete(playback)) {
    return bundle?.audit?.entries ?? [];
  }
  return playback.liveAudit ?? [];
}

export function summarizeEvalReports(reports) {
  return reports.reduce(
    (summary, report) => {
      if (report.status === "pass") summary.pass += 1;
      else if (report.status === "partial") summary.partial += 1;
      else summary.fail += 1;
      summary.criticalFailureCount += report.criticalFailures?.length ?? 0;
      return summary;
    },
    { pass: 0, partial: 0, fail: 0, criticalFailureCount: 0 }
  );
}

export function formatDemoDate(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").replace(".000Z", "Z");
}

export function percentScore(value) {
  if (typeof value !== "number") return "-";
  return `${Math.round(value * 100)}%`;
}
