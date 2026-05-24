import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getBatchResults, getBatchStatus } from "../api/caseFilingApi.js";

const STORAGE_KEY = "caseFiling.activeBatchId";
const HISTORY_KEY = "caseFiling.batchHistory";

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushHistory(batchId) {
  const prev = readHistory().filter((id) => id !== batchId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([batchId, ...prev].slice(0, 20)));
}

export function useBatchSession() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [batchId, setBatchIdState] = useState(
    () => searchParams.get("batch") || localStorage.getItem(STORAGE_KEY) || null
  );
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [polling, setPolling] = useState(false);
  const [history, setHistory] = useState(readHistory);

  const setBatchId = useCallback(
    (id) => {
      setBatchIdState(id);
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
        pushHistory(id);
        setHistory(readHistory());
        setSearchParams({ batch: id });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setSearchParams({});
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!batchId) return undefined;

    let cancelled = false;
    let timer;

    async function poll() {
      setPolling(true);
      try {
        const st = await getBatchStatus(batchId);
        if (cancelled) return;
        setStatus(st);
        if (["completed", "partial", "failed"].includes(st.status)) {
          const res = await getBatchResults(batchId);
          if (!cancelled) setResults(res);
          setPolling(false);
          return;
        }
        timer = setTimeout(poll, 1500);
      } catch {
        if (!cancelled) setPolling(false);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [batchId]);

  return {
    batchId,
    setBatchId,
    status,
    results,
    polling,
    history,
    resumeBatch: setBatchId
  };
}
