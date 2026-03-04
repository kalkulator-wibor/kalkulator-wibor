import Dexie, { type EntityTable } from 'dexie';
import type { Case, WiborDataset } from './types';

export const db = new Dexie('wibor-calculator') as Dexie & {
  cases: EntityTable<Case, 'id'>;
  wiborDatasets: EntityTable<WiborDataset, 'id'>;
};

db.version(1).stores({
  cases: 'id',
  wiborDatasets: 'id',
});
