/**
 * Batch storage adapter boundary (filesystem today; database later).
 *
 * Implementations should honor paths from `resolveArtifactPaths()` for
 * `CASE_FILING_BATCH_DIR` until a DB-backed adapter is registered.
 *
 * @typedef {Object} BatchStorageAdapter
 * @property {(batchId: string) => Promise<boolean>} batchExists
 * @property {(batchId: string) => Promise<Buffer>} readUpload
 * @property {(batchId: string, storedName: string, data: Buffer) => Promise<void>} writeUpload
 * @property {(batchId: string, docKey: string, data: object) => Promise<void>} writeDocumentOutput
 * @property {(batchId: string) => Promise<object|null>} readCaseSnapshot
 * @property {(batchId: string, snapshot: object) => Promise<void>} writeCaseSnapshot
 * @property {(batchId: string) => Promise<string[]>} listDocuments
 */

/** Default implementation: `createLocalJsonStore` in services/localJsonStore.service.js */
export const BATCH_STORAGE_IMPL = "filesystem";
