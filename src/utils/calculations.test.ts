import { describe, it, expect } from 'vitest';
import { calculateLoan, type LoanInput, type WiborEntry } from './calculations';

const wiborData: WiborEntry[] = [
  { date: '2022-01-01', rate: 3.0 },
  { date: '2022-07-01', rate: 7.0 },
];

function makeInput(overrides: Partial<LoanInput> = {}): LoanInput {
  return {
    loanAmount: 300_000,
    margin: 2.0,
    loanPeriodMonths: 360,
    startDate: new Date(2022, 0, 1),
    bridgeMargin: 0,
    bridgeEndDate: null,
    paymentDay: 15,
    wiborData,
    ...overrides,
  };
}

describe('calculateLoan', () => {
  it('returns correct number of installments', () => {
    const result = calculateLoan(makeInput());
    expect(result.schedule).toHaveLength(360);
    expect(result.scheduleNoWibor).toHaveLength(360);
  });

  it('first installment date is one month after start', () => {
    const result = calculateLoan(makeInput());
    const first = result.schedule[0];
    expect(first.date.getFullYear()).toBe(2022);
    expect(first.date.getMonth()).toBe(1); // February
    expect(first.date.getDate()).toBe(15);
  });

  it('balance reaches zero after all installments', () => {
    const result = calculateLoan(makeInput());
    const last = result.schedule[result.schedule.length - 1];
    expect(last.remainingBalance).toBeCloseTo(0, 0);
    const lastNW = result.scheduleNoWibor[result.scheduleNoWibor.length - 1];
    expect(lastNW.remainingBalance).toBeCloseTo(0, 0);
  });

  it('interest breakdown sums to total interest', () => {
    const result = calculateLoan(makeInput());
    for (const row of result.schedule) {
      const sum = row.interestWibor + row.interestMargin + row.interestBridge;
      expect(sum).toBeCloseTo(row.interestTotal, 6);
    }
  });

  it('overpaidInterest = past interest with WIBOR minus past interest without', () => {
    const result = calculateLoan(makeInput());
    expect(result.overpaidInterest).toBeCloseTo(
      result.pastInterestTotal - result.pastInterestNoWibor, 2
    );
  });

  it('no-WIBOR schedule has lower total interest than WIBOR schedule', () => {
    const result = calculateLoan(makeInput());
    const totalInterest = result.schedule.reduce((s, r) => s + r.interestTotal, 0);
    const totalInterestNW = result.scheduleNoWibor.reduce((s, r) => s + r.interest, 0);
    expect(totalInterestNW).toBeLessThan(totalInterest);
  });

  it('WIBOR resets every 3 months', () => {
    const result = calculateLoan(makeInput());
    // Installments 1,4,7... should recalculate. Within a 3-month block rate stays same.
    expect(result.schedule[0].wiborRate).toBe(3.0);
    expect(result.schedule[1].wiborRate).toBe(3.0);
    expect(result.schedule[2].wiborRate).toBe(3.0);
    // After July 2022 WIBOR jumps to 7.0 — installment 7 (Aug 2022)
    expect(result.schedule[6].wiborRate).toBe(7.0);
  });

  it('bridge margin applies only before bridgeEndDate', () => {
    const result = calculateLoan(makeInput({
      bridgeMargin: 1.5,
      bridgeEndDate: new Date(2022, 5, 1), // June 2022
    }));
    // First installment (Feb 2022) should have bridge interest > 0
    expect(result.schedule[0].interestBridge).toBeGreaterThan(0);
    // Installment after bridge end (Jul 2022, index 5) should have bridge = 0
    expect(result.schedule[5].interestBridge).toBe(0);
  });

  it('handles zero WIBOR data gracefully', () => {
    const result = calculateLoan(makeInput({ wiborData: [] }));
    expect(result.schedule).toHaveLength(360);
    // All WIBOR interest should be 0
    for (const row of result.schedule) {
      expect(row.wiborRate).toBe(0);
      expect(row.interestWibor).toBe(0);
    }
  });

  it('adapts payment day to shorter months', () => {
    const result = calculateLoan(makeInput({ paymentDay: 31 }));
    const feb = result.schedule[0]; // Feb 2022
    expect(feb.date.getDate()).toBe(28); // Feb has 28 days in 2022
  });

  it('aggregates past/future totals correctly', () => {
    const result = calculateLoan(makeInput());
    const pastFromSchedule = result.schedule
      .filter(r => r.isPast)
      .reduce((s, r) => s + r.installment, 0);
    expect(result.pastTotalPaid).toBeCloseTo(pastFromSchedule, 2);

    const futureFromSchedule = result.schedule
      .filter(r => !r.isPast)
      .reduce((s, r) => s + r.installment, 0);
    expect(result.futureTotalToPay).toBeCloseTo(futureFromSchedule, 2);
  });
});
