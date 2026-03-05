import Dexie, { type EntityTable } from 'dexie';
import type { Case, WiborDataset, CaseFile } from './types';

export const db = new Dexie('wibor-calculator') as Dexie & {
  cases: EntityTable<Case, 'id'>;
  wiborDatasets: EntityTable<WiborDataset, 'id'>;
  caseFiles: EntityTable<CaseFile, 'id'>;
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
