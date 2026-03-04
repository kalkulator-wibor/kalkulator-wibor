import type { ExplanationStep } from '../explanationTypes';
import type { CalculationResult } from '../calculations';
import { formatPLN } from '../formatters';

type StepFn = (r: CalculationResult) => ExplanationStep[];

const explanations: Record<string, StepFn> = {
  'past-total-paid': (r) => [{
    id: 'past-total-paid',
    title: 'Wpłacono łącznie',
    formula: 'Suma = Σ (kapitał_i + odsetki_i) dla rat 1..N',
    inputs: [
      { label: 'Liczba spłaconych rat', symbol: 'N', value: r.pastInstallmentsCount, formatted: `${r.pastInstallmentsCount} rat` },
      { label: 'Spłacony kapitał', symbol: 'K', value: r.pastPrincipalPaid, formatted: formatPLN(r.pastPrincipalPaid) },
      { label: 'Zapłacone odsetki', symbol: 'I', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
    ],
    result: { label: 'Wpłacono łącznie', symbol: 'Suma', value: r.pastTotalPaid, formatted: formatPLN(r.pastTotalPaid) },
    notes: 'Suma wszystkich dotychczasowych rat (kapitał + odsetki).',
  }],

  'past-principal': (r) => [{
    id: 'past-principal',
    title: 'Spłacony kapitał',
    formula: 'K = Σ kapitał_i dla rat 1..N',
    inputs: [
      { label: 'Liczba spłaconych rat', symbol: 'N', value: r.pastInstallmentsCount, formatted: `${r.pastInstallmentsCount} rat` },
      { label: 'Wpłacono łącznie', symbol: 'Suma', value: r.pastTotalPaid, formatted: formatPLN(r.pastTotalPaid) },
      { label: 'Zapłacone odsetki', symbol: 'I', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
    ],
    result: { label: 'Spłacony kapitał', symbol: 'K', value: r.pastPrincipalPaid, formatted: formatPLN(r.pastPrincipalPaid) },
    notes: 'Część kapitałowa ze wszystkich spłaconych rat. K = Suma - I.',
  }],

  'past-interest': (r) => [{
    id: 'past-interest',
    title: 'Zapłacone odsetki',
    formula: 'I = I_W + I_M + I_B',
    inputs: [
      { label: 'Odsetki z WIBOR', symbol: 'I_W', value: r.pastInterestWibor, formatted: formatPLN(r.pastInterestWibor) },
      { label: 'Odsetki z marży', symbol: 'I_M', value: r.pastInterestMargin, formatted: formatPLN(r.pastInterestMargin) },
      ...(r.pastInterestBridge > 0 ? [{ label: 'Odsetki pomostowe', symbol: 'I_B', value: r.pastInterestBridge, formatted: formatPLN(r.pastInterestBridge) }] : []),
    ],
    result: { label: 'Zapłacone odsetki', symbol: 'I', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
    notes: 'Suma odsetek ze wszystkich spłaconych rat, rozbita na składniki.',
  }],

  'interest-wibor': (r) => [{
    id: 'interest-wibor',
    title: 'Odsetki z WIBOR',
    formula: 'I_W = Σ (saldo_i × WIBOR_i / 100 × dni_i / 360)',
    inputs: [
      { label: 'Liczba rat', symbol: 'N', value: r.pastInstallmentsCount, formatted: `${r.pastInstallmentsCount} rat` },
      { label: 'Całość odsetek', symbol: 'I', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
    ],
    result: { label: 'Odsetki z WIBOR', symbol: 'I_W', value: r.pastInterestWibor, formatted: formatPLN(r.pastInterestWibor) },
    notes: 'Suma składnika WIBOR z odsetek każdej raty. Kliknij info przy racie w harmonogramie, aby zobaczyć obliczenie dla konkretnej raty.',
  }],

  'interest-margin': (r) => [{
    id: 'interest-margin',
    title: 'Odsetki z marży',
    formula: 'I_M = Σ (saldo_i × marża / 100 × dni_i / 360)',
    inputs: [
      { label: 'Liczba rat', symbol: 'N', value: r.pastInstallmentsCount, formatted: `${r.pastInstallmentsCount} rat` },
      { label: 'Całość odsetek', symbol: 'I', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
    ],
    result: { label: 'Odsetki z marży', symbol: 'I_M', value: r.pastInterestMargin, formatted: formatPLN(r.pastInterestMargin) },
    notes: 'Suma składnika marży banku z odsetek każdej raty.',
  }],

  'interest-bridge': (r) => [{
    id: 'interest-bridge',
    title: 'Odsetki z marży pomostowej',
    formula: 'I_B = Σ (saldo_i × marża_pomostowa / 100 × dni_i / 360)',
    inputs: [
      { label: 'Całość odsetek', symbol: 'I', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
    ],
    result: { label: 'Odsetki pomostowe', symbol: 'I_B', value: r.pastInterestBridge, formatted: formatPLN(r.pastInterestBridge) },
    notes: 'Marża pomostowa naliczana do momentu wpisu hipoteki do księgi wieczystej.',
  }],

  'future-total': (r) => [{
    id: 'future-total',
    title: 'Do spłaty łącznie',
    formula: 'Suma_przyszła = Σ rata_i dla rat przyszłych',
    inputs: [
      { label: 'Pozostałe raty', symbol: 'N', value: r.futureInstallmentsCount, formatted: `${r.futureInstallmentsCount} rat` },
      { label: 'Przyszłe odsetki', symbol: 'I', value: r.futureInterestTotal, formatted: formatPLN(r.futureInterestTotal) },
      { label: 'Przyszły kapitał', symbol: 'K', value: r.futurePrincipalToPay, formatted: formatPLN(r.futurePrincipalToPay) },
    ],
    result: { label: 'Do spłaty łącznie', symbol: 'Suma', value: r.futureTotalToPay, formatted: formatPLN(r.futureTotalToPay) },
    notes: 'Prognoza przy założeniu utrzymania obecnej stawki WIBOR do końca okresu kredytu.',
  }],

  'current-installment': (r) => [{
    id: 'current-installment',
    title: 'Obecna rata',
    formula: 'R = S × (r × (1+r)^n) / ((1+r)^n - 1)',
    inputs: [
      { label: 'Rata miesięczna', symbol: 'R', value: r.currentInstallment, formatted: formatPLN(r.currentInstallment) },
    ],
    result: { label: 'Obecna rata', symbol: 'R', value: r.currentInstallment, formatted: formatPLN(r.currentInstallment) },
    notes: 'Rata wyliczona wzorem annuitetowym z obecną stawką WIBOR + marżą. Szczegóły w harmonogramie (ikonka info przy racie).',
  }],

  'future-interest': (r) => [{
    id: 'future-interest',
    title: 'Przyszłe odsetki',
    formula: 'I_przyszłe = I_W_przyszłe + I_M_przyszłe',
    inputs: [
      { label: 'WIBOR przyszły', symbol: 'I_W', value: r.futureInterestWibor, formatted: formatPLN(r.futureInterestWibor) },
      { label: 'Marża przyszła', symbol: 'I_M', value: r.futureInterestMargin, formatted: formatPLN(r.futureInterestMargin) },
    ],
    result: { label: 'Przyszłe odsetki', symbol: 'I', value: r.futureInterestTotal, formatted: formatPLN(r.futureInterestTotal) },
    notes: 'Prognoza przyszłych odsetek przy założeniu stałego WIBOR.',
  }],

  'overpaid-interest': (r) => [
    {
      id: 'overpaid-actual',
      title: 'Krok 1: Odsetki faktycznie zapłacone',
      formula: 'I_faktyczne = Σ odsetki_i (z WIBOR)',
      inputs: [
        { label: 'Odsetki z WIBOR', symbol: 'I_W', value: r.pastInterestWibor, formatted: formatPLN(r.pastInterestWibor) },
        { label: 'Odsetki z marży', symbol: 'I_M', value: r.pastInterestMargin, formatted: formatPLN(r.pastInterestMargin) },
      ],
      result: { label: 'Odsetki faktyczne', symbol: 'I_fakt', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
    },
    {
      id: 'overpaid-nowibor',
      title: 'Krok 2: Odsetki w scenariuszu bez WIBOR',
      formula: 'I_bezWIBOR = Σ odsetki_i (tylko marża)',
      inputs: [
        { label: 'Odsetki bez WIBOR', symbol: 'I_bW', value: r.pastInterestNoWibor, formatted: formatPLN(r.pastInterestNoWibor) },
      ],
      result: { label: 'Odsetki bez WIBOR', symbol: 'I_bW', value: r.pastInterestNoWibor, formatted: formatPLN(r.pastInterestNoWibor) },
      notes: 'Hipotetyczny scenariusz: kredyt oprocentowany wyłącznie marżą banku (bez WIBOR). Odsetki liczone na osobnym harmonogramie, gdzie saldo spada szybciej.',
    },
    {
      id: 'overpaid-diff',
      title: 'Krok 3: Różnica',
      formula: 'Różnica = I_fakt - I_bW',
      inputs: [
        { label: 'Odsetki faktyczne', symbol: 'I_fakt', value: r.pastInterestTotal, formatted: formatPLN(r.pastInterestTotal) },
        { label: 'Odsetki bez WIBOR', symbol: 'I_bW', value: r.pastInterestNoWibor, formatted: formatPLN(r.pastInterestNoWibor) },
      ],
      result: { label: 'Różnica w odsetkach', symbol: 'Δ', value: r.overpaidInterest, formatted: formatPLN(r.overpaidInterest) },
      notes: `Kwota jest wyższa niż same "odsetki z WIBOR" (${formatPLN(r.pastInterestWibor)}), ponieważ WIBOR powoduje wolniejszą spłatę kapitału → wyższe saldo → wyższe odsetki od marży. Ta różnica (${formatPLN(r.overpaidInterest - r.pastInterestWibor)}) to koszt pośredni WIBOR.`,
    },
  ],

  'future-savings': (r) => [
    {
      id: 'savings-with',
      title: 'Krok 1: Przyszłe raty z WIBOR',
      formula: 'Suma_z = Σ rata_i (z WIBOR)',
      inputs: [
        { label: 'Pozostałe raty', symbol: 'N', value: r.futureInstallmentsCount, formatted: `${r.futureInstallmentsCount} rat` },
      ],
      result: { label: 'Przyszłe raty z WIBOR', symbol: 'Suma_z', value: r.futureTotalToPay, formatted: formatPLN(r.futureTotalToPay) },
    },
    {
      id: 'savings-without',
      title: 'Krok 2: Przyszłe raty bez WIBOR',
      formula: 'Suma_bez = Σ rata_i (bez WIBOR)',
      inputs: [
        { label: 'Raty bez WIBOR', symbol: 'Suma_bez', value: r.futureTotalNoWibor, formatted: formatPLN(r.futureTotalNoWibor) },
      ],
      result: { label: 'Przyszłe raty bez WIBOR', symbol: 'Suma_bez', value: r.futureTotalNoWibor, formatted: formatPLN(r.futureTotalNoWibor) },
    },
    {
      id: 'savings-diff',
      title: 'Krok 3: Oszczędność',
      formula: 'Oszczędność = Suma_z - Suma_bez',
      inputs: [
        { label: 'Z WIBOR', symbol: 'Suma_z', value: r.futureTotalToPay, formatted: formatPLN(r.futureTotalToPay) },
        { label: 'Bez WIBOR', symbol: 'Suma_bez', value: r.futureTotalNoWibor, formatted: formatPLN(r.futureTotalNoWibor) },
      ],
      result: { label: 'Oszczędność na przyszłość', symbol: 'Δ', value: r.futureSavings, formatted: formatPLN(r.futureSavings) },
      notes: 'Różnica w łącznych przyszłych ratach pomiędzy scenariuszem z WIBOR a bez WIBOR.',
    },
  ],

  'total-benefit': (r) => [{
    id: 'total-benefit',
    title: 'Łączna korzyść',
    formula: 'Korzyść = Różnica + Oszczędność',
    inputs: [
      { label: 'Różnica w odsetkach', symbol: 'Różnica', value: r.overpaidInterest, formatted: formatPLN(r.overpaidInterest) },
      { label: 'Oszczędność przyszła', symbol: 'Oszcz', value: r.futureSavings, formatted: formatPLN(r.futureSavings) },
    ],
    result: { label: 'Łączna korzyść', symbol: 'K', value: r.overpaidInterest + r.futureSavings, formatted: formatPLN(r.overpaidInterest + r.futureSavings) },
    notes: 'Suma różnicy w dotychczasowych odsetkach i przyszłych niższych rat w scenariuszu bez WIBOR.',
  }],

  'installment-no-wibor': (r) => [{
    id: 'installment-no-wibor',
    title: 'Rata bez WIBOR',
    formula: 'R_bez = S × (r × (1+r)^n) / ((1+r)^n - 1) gdzie r = marża/12',
    inputs: [
      { label: 'Obecna rata', symbol: 'R', value: r.currentInstallment, formatted: formatPLN(r.currentInstallment) },
      { label: 'Rata bez WIBOR', symbol: 'R_bez', value: r.installmentNoWibor, formatted: formatPLN(r.installmentNoWibor) },
    ],
    result: { label: 'Rata bez WIBOR', symbol: 'R_bez', value: r.installmentNoWibor, formatted: formatPLN(r.installmentNoWibor) },
    notes: `Rata obliczona wzorem annuitetowym z oprocentowaniem równym wyłącznie marży banku (bez WIBOR). Miesięczna oszczędność: ${formatPLN(r.currentInstallment - r.installmentNoWibor)}.`,
  }],
};

export function getSummaryExplanation(metricId: string, result: CalculationResult): ExplanationStep[] {
  const fn = explanations[metricId];
  return fn ? fn(result) : [];
}
