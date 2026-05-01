import { dalGetLegalDocument } from '../dal/legalDocuments.read.dal'

export async function getLegalDocumentController({ appKey, documentType, version }) {
  return dalGetLegalDocument({ appKey, documentType, version })
}
