export function UploadedFileList({ files, onRemoveFile, onClearFiles }) {
  if (!files.length) {
    return (
      <div className="panel pdf-file-list">
        <h3>Selected files</h3>
        <p className="muted">No files yet. Drop filings here or use Choose files above.</p>
      </div>
    );
  }

  return (
    <div className="panel pdf-file-list">
      <div className="file-list-header">
        <h3>Selected files ({files.length})</h3>
        {onClearFiles && (
          <button type="button" className="link-button" onClick={onClearFiles}>
            Clear all
          </button>
        )}
      </div>
      <ol>
        {files.map((file, index) => (
          <li key={`${file.name}-${file.size}-${index}`}>
            <code>{file.name}</code>
            <span className="muted"> · {(file.size / 1024).toFixed(1)} KB</span>
            {onRemoveFile && (
              <button
                type="button"
                className="link-button remove-file"
                onClick={() => onRemoveFile(index)}
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ol>
      <p className="muted file-list-hint">Drop more files anywhere in this section to add them.</p>
    </div>
  );
}
