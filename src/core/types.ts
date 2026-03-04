import type { WiborEntry } from '../utils/calculations';

export interface StoredLoanInput {
  loanAmount: number;
  margin: number;
  loanPeriodMonths: number;
  startDate: string;
  bridgeMargin: number;
  bridgeEndDate: string | null;
  paymentDay: number;
}

export interface Case {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  input: StoredLoanInput;
  wiborDatasetId: string | null;
}

export interface WiborDataset {
  id: string;
  name: string;
  createdAt: string;
  entries: WiborEntry[];
}
