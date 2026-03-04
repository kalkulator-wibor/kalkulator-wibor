import { daysBetween, toDateString } from './formatters';

export interface WiborEntry { date: string; rate: number; }

export const compareByDate = (a: WiborEntry, b: WiborEntry) => a.date.localeCompare(b.date);

export interface LoanInput {
  loanAmount: number;
  margin: number;
  loanPeriodMonths: number;
  startDate: Date;
  bridgeMargin: number;
  bridgeEndDate: Date | null;
  paymentDay: number;
  wiborData?: WiborEntry[];
}

function resolveWiborRate(date: Date, wiborData: WiborEntry[] = []): number {
  const dateStr = toDateString(date);
  let bestRate = wiborData[0]?.rate ?? 0;
  for (const entry of wiborData) {
    if (entry.date <= dateStr) bestRate = entry.rate;
    else break;
  }
  return bestRate;
}

export interface InstallmentRow {
  number: number;
  date: Date;
  prevDate: Date;
  days: number;
  wiborRate: number;
  totalRate: number;
  installment: number;
  principal: number;
  interestTotal: number;
  interestWibor: number;
  interestMargin: number;
  interestBridge: number;
  remainingBalance: number;
  isPast: boolean;
}

export interface InstallmentRowNoWibor {
  number: number;
  date: Date;
  installment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface CalculationResult {
  schedule: InstallmentRow[];
  scheduleNoWibor: InstallmentRowNoWibor[];
  pastTotalPaid: number;
  pastPrincipalPaid: number;
  pastInterestTotal: number;
  pastInterestWibor: number;
  pastInterestMargin: number;
  pastInterestBridge: number;
  pastInstallmentsCount: number;
  futureTotalToPay: number;
  futurePrincipalToPay: number;
  futureInterestTotal: number;
  futureInterestWibor: number;
  futureInterestMargin: number;
  futureInstallmentsCount: number;
  pastTotalPaidNoWibor: number;
  pastInterestNoWibor: number;
  pastPrincipalNoWibor: number;
  futureTotalNoWibor: number;
  futureInterestNoWibor: number;
  overpaidInterest: number;
  futureSavings: number;
  currentInstallment: number;
  installmentNoWibor: number;
}

function getPaymentDate(startDate: Date, monthOffset: number, paymentDay: number): Date {
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + monthOffset;
  const targetYear = year + Math.floor(month / 12);
  const targetMonth = month % 12;
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(paymentDay, daysInMonth));
}

function annuity(balance: number, annualRate: number, months: number): number {
  if (annualRate <= 0 || months <= 0) return months > 0 ? balance / months : balance;
  const r = annualRate / 100 / 12;
  const f = Math.pow(1 + r, months);
  return balance * (r * f) / (f - 1);
}

function interest(balance: number, ratePct: number, days: number): number {
  return balance * (ratePct / 100) * days / 360;
}

export function calculateLoan(input: LoanInput): CalculationResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedule: InstallmentRow[] = [];
  const scheduleNoWibor: InstallmentRowNoWibor[] = [];
  let balance = input.loanAmount;
  let balanceNoWibor = input.loanAmount;
  let prevDate = new Date(input.startDate);
  let currentWibor = resolveWiborRate(input.startDate, input.wiborData);
  let installmentAmount = 0;
  let installmentNoWiborAmount = 0;
  let monthsSinceReset = 0;

  for (let i = 1; i <= input.loanPeriodMonths; i++) {
    const paymentDate = getPaymentDate(input.startDate, i, input.paymentDay);
    const days = daysBetween(prevDate, paymentDate);
    const remainingMonths = input.loanPeriodMonths - i + 1;
    const bridgeActive = input.bridgeEndDate ? paymentDate <= input.bridgeEndDate : false;
    const effectiveBridgeMargin = bridgeActive ? input.bridgeMargin : 0;

    monthsSinceReset++;
    if (monthsSinceReset >= 3 || i === 1) {
      if (i > 1) currentWibor = resolveWiborRate(paymentDate, input.wiborData);
      monthsSinceReset = 0;
      installmentAmount = annuity(balance, currentWibor + input.margin + effectiveBridgeMargin, remainingMonths);
      installmentNoWiborAmount = annuity(balanceNoWibor, input.margin + effectiveBridgeMargin, remainingMonths);
    }

    const iW = interest(balance, currentWibor, days);
    const iM = interest(balance, input.margin, days);
    const iB = interest(balance, effectiveBridgeMargin, days);
    const iTotal = iW + iM + iB;

    let principal = Math.max(installmentAmount - iTotal, 0);
    if (i === input.loanPeriodMonths || principal > balance) principal = balance;

    const isPast = paymentDate <= today;
    schedule.push({
      number: i, date: paymentDate, prevDate: new Date(prevDate), days,
      wiborRate: currentWibor, totalRate: currentWibor + input.margin + effectiveBridgeMargin,
      installment: principal + iTotal, principal, interestTotal: iTotal,
      interestWibor: iW, interestMargin: iM, interestBridge: iB,
      remainingBalance: balance - principal, isPast,
    });
    balance = Math.max(balance - principal, 0);

    const iNW = interest(balanceNoWibor, input.margin + effectiveBridgeMargin, days);
    let pNW = Math.max(installmentNoWiborAmount - iNW, 0);
    if (i === input.loanPeriodMonths || pNW > balanceNoWibor) pNW = balanceNoWibor;
    scheduleNoWibor.push({ number: i, date: paymentDate, installment: pNW + iNW, principal: pNW, interest: iNW, remainingBalance: balanceNoWibor - pNW });
    balanceNoWibor = Math.max(balanceNoWibor - pNW, 0);

    prevDate = paymentDate;
  }

  // Single-pass aggregation
  const agg = {
    pastTotalPaid: 0, pastPrincipal: 0, pastInterestTotal: 0,
    pastInterestWibor: 0, pastInterestMargin: 0, pastInterestBridge: 0, pastCount: 0,
    futureTotalToPay: 0, futurePrincipal: 0, futureInterestTotal: 0,
    futureInterestWibor: 0, futureInterestMargin: 0, futureCount: 0,
    pastTotalNW: 0, pastInterestNW: 0, pastPrincipalNW: 0,
    futureTotalNW: 0, futureInterestNW: 0,
    currentInstallment: 0, installmentNoWibor: 0,
  };

  for (let i = 0; i < schedule.length; i++) {
    const row = schedule[i];
    const nw = scheduleNoWibor[i];
    if (row.isPast) {
      agg.pastTotalPaid += row.installment;
      agg.pastPrincipal += row.principal;
      agg.pastInterestTotal += row.interestTotal;
      agg.pastInterestWibor += row.interestWibor;
      agg.pastInterestMargin += row.interestMargin;
      agg.pastInterestBridge += row.interestBridge;
      agg.pastCount++;
      agg.pastTotalNW += nw.installment;
      agg.pastInterestNW += nw.interest;
      agg.pastPrincipalNW += nw.principal;
    } else {
      if (agg.futureCount === 0) {
        agg.currentInstallment = row.installment;
        agg.installmentNoWibor = nw.installment;
      }
      agg.futureTotalToPay += row.installment;
      agg.futurePrincipal += row.principal;
      agg.futureInterestTotal += row.interestTotal;
      agg.futureInterestWibor += row.interestWibor;
      agg.futureInterestMargin += row.interestMargin;
      agg.futureCount++;
      agg.futureTotalNW += nw.installment;
      agg.futureInterestNW += nw.interest;
    }
  }

  return {
    schedule, scheduleNoWibor,
    pastTotalPaid: agg.pastTotalPaid,
    pastPrincipalPaid: agg.pastPrincipal,
    pastInterestTotal: agg.pastInterestTotal,
    pastInterestWibor: agg.pastInterestWibor,
    pastInterestMargin: agg.pastInterestMargin,
    pastInterestBridge: agg.pastInterestBridge,
    pastInstallmentsCount: agg.pastCount,
    futureTotalToPay: agg.futureTotalToPay,
    futurePrincipalToPay: agg.futurePrincipal,
    futureInterestTotal: agg.futureInterestTotal,
    futureInterestWibor: agg.futureInterestWibor,
    futureInterestMargin: agg.futureInterestMargin,
    futureInstallmentsCount: agg.futureCount,
    pastTotalPaidNoWibor: agg.pastTotalNW,
    pastInterestNoWibor: agg.pastInterestNW,
    pastPrincipalNoWibor: agg.pastPrincipalNW,
    futureTotalNoWibor: agg.futureTotalNW,
    futureInterestNoWibor: agg.futureInterestNW,
    overpaidInterest: agg.pastInterestTotal - agg.pastInterestNW,
    futureSavings: agg.futureTotalToPay - agg.futureTotalNW,
    currentInstallment: agg.currentInstallment,
    installmentNoWibor: agg.installmentNoWibor,
  };
}
