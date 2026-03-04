import type { LoanInput } from '../utils/calculations';
import { toDateString } from '../utils/formatters';
import type { StoredLoanInput } from './types';

export function toLoanInput(stored: StoredLoanInput): LoanInput {
  return {
    ...stored,
    startDate: new Date(stored.startDate),
    bridgeEndDate: stored.bridgeEndDate ? new Date(stored.bridgeEndDate) : null,
  };
}

export function toStoredInput(input: LoanInput): StoredLoanInput {
  return {
    loanAmount: input.loanAmount,
    margin: input.margin,
    loanPeriodMonths: input.loanPeriodMonths,
    startDate: toDateString(input.startDate),
    bridgeMargin: input.bridgeMargin,
    bridgeEndDate: input.bridgeEndDate ? toDateString(input.bridgeEndDate) : null,
    paymentDay: input.paymentDay,
  };
}
