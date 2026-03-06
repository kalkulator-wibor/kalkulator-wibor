import Dexie, { type EntityTable } from 'dexie';
import type { Case, WiborDataset, CaseFile, DocumentText, DocumentChunk } from './types';

export const db = new Dexie('wibor-calculator') as Dexie & {
  cases: EntityTable<Case, 'id'>;
  wiborDatasets: EntityTable<WiborDataset, 'id'>;
  caseFiles: EntityTable<CaseFile, 'id'>;
  documentTexts: EntityTable<DocumentText, 'id'>;
  documentChunks: EntityTable<DocumentChunk, 'id'>;
};

db.version(1).stores({
  cases: 'id',
  wiborDatasets: 'id',
});

db.version(2).stores({
  cases: 'id',
  wiborDatasets: 'id',
  caseFiles: 'id, caseId',
});

db.version(3).stores({
  cases: 'id',
  wiborDatasets: 'id',
  caseFiles: 'id, caseId',
  documentTexts: 'id, caseId',
});

db.version(4).stores({
  cases: 'id',
  wiborDatasets: 'id',
  caseFiles: 'id, caseId',
  documentTexts: 'id, caseId',
  documentChunks: 'id, documentId, caseId',
});
