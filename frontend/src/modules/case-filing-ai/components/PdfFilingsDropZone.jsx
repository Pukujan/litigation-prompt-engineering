import { useRef, useState } from "react";
import { filesFromDataTransfer } from "../utils/document-files.js";

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

export function PdfFilingsDropZone({ onAddFiles, disabled, children }) {
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);

  function handleDragEnter(event) {
    preventDefaults(event);
    if (disabled) return;
    dragDepth.current += 1;
    setDragActive(true);
  }

  function handleDragLeave(event) {
    preventDefaults(event);
    if (disabled) return;
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragActive(false);
    }
  }

  function handleDragOver(event) {
    preventDefaults(event);
    if (disabled) return;
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event) {
    preventDefaults(event);
    dragDepth.current = 0;
    setDragActive(false);
    if (disabled) return;
    onAddFiles(filesFromDataTransfer(event.dataTransfer));
  }

  return (
    <div
      className={`pdf-filings-dropzone${dragActive ? " drag-active" : ""}${disabled ? " disabled" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
