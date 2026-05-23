/**
 * @typedef {Object} BatchDocumentResult
 * @property {string} docKey
 * @property {number} docIndex
 * @property {string} storedName
 * @property {string} originalName
 * @property {Object} documentMetadata
 * @property {Object} extractionQuality
 * @property {Object} docketEntry
 * @property {Object} caseUpdates
 * @property {Array} parties
 * @property {Array} witnesses
 * @property {Array} tasks
 * @property {Array} deadlines
 * @property {Array} humanReviewItems
 * @property {Array} auditNotes
 */

/**
 * @typedef {Object} BatchProcessResult
 * @property {string} batchId
 * @property {Object} caseSnapshot
 * @property {BatchDocumentResult[]} documents
 * @property {Array} tasks
 * @property {Array} deadlines
 * @property {Array} humanReviewItems
 */

/**
 * @typedef {Object} BatchStatus
 * @property {string} batchId
 * @property {"pending"|"processing"|"completed"} status
 * @property {string} currentStep
 * @property {string|null} currentDocument
 * @property {number} processedCount
 * @property {number} totalCount
 */

export {};
