import { useCallback, useState } from "react";
import { mergeUploadFiles, partitionUploadFiles } from "../utils/document-files.js";

export function useDocumentFileAccumulator() {
  const [files, setFiles] = useState([]);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addFiles = useCallback(async (incoming) => {
    const list = Array.from(incoming ?? []);
    if (!list.length) return;

    setIsAdding(true);
    try {
      const { accepted, rejected } = await partitionUploadFiles(list);

      if (rejected.length && !accepted.length) {
        setRejectionNote(
          `No supported files in selection. Skipped: ${rejected.map((f) => f.name || "unnamed").join(", ")}`
        );
      } else if (rejected.length) {
        setRejectionNote(
          `Added ${accepted.length} file(s). Skipped unsupported: ${rejected.map((f) => f.name).join(", ")}`
        );
      } else {
        setRejectionNote("");
      }

      if (accepted.length) {
        setFiles((prev) => mergeUploadFiles(prev, accepted));
      }
    } finally {
      setIsAdding(false);
    }
  }, []);

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setRejectionNote("");
  }, []);

  return { files, rejectionNote, isAdding, addFiles, removeFile, clearFiles };
}
