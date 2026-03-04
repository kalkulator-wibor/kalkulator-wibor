import { db } from './db';
import type { WiborDataset } from './types';

export async function getAllDatasets(): Promise<WiborDataset[]> {
  return db.wiborDatasets.toArray();
}

export async function getDataset(id: string): Promise<WiborDataset | undefined> {
  return db.wiborDatasets.get(id);
}

export async function saveDataset(ds: WiborDataset): Promise<void> {
  await db.wiborDatasets.put(ds);
}

export async function deleteDataset(id: string): Promise<void> {
  await db.wiborDatasets.delete(id);
}
