import { db } from './db';
import type { Case } from './types';

export async function getAllCases(): Promise<Case[]> {
  const cases = await db.cases.toArray();
  return cases.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCase(id: string): Promise<Case | undefined> {
  return db.cases.get(id);
}

export async function saveCase(c: Case): Promise<void> {
  await db.cases.put(c);
}

export async function deleteCase(id: string): Promise<void> {
  await db.cases.delete(id);
}

export function createNewCase(name: string): Case {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    input: {
      loanAmount: 200000,
      margin: 2.09,
      loanPeriodMonths: 300,
      startDate: '2015-09-03',
      bridgeMargin: 0,
      bridgeEndDate: null,
      paymentDay: 30,
    },
    wiborDatasetId: null,
  };
}
