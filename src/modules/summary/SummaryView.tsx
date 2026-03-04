import { useState, useMemo } from 'react';
import { formatPLN } from '../../utils/formatters';
import { getSummaryExplanation } from '../../utils/explanations/summaryExplanations';
import { StatCard } from '../../components/ui/StatCard';
import { StepCard } from '../../components/ui/ExplanationCard';
import { Sheet } from '../../components/ui/Sheet';
import { CalculationDisclaimer } from '../../components/ui/CalculationDisclaimer';
import { useResult } from '../../core/CaseContext';
import { pctOf } from './summaryHelpers';

export default function SummaryView() {
  const result = useResult();
  const [sheetMetric, setSheetMetric] = useState<{ id: string; title: string } | null>(null);

  const sheetSteps = useMemo(
    () => sheetMetric && result ? getSummaryExplanation(sheetMetric.id, result) : [],
    [sheetMetric, result],
  );

  if (!result) return null;
  const r = result;

  const info = (metricId: string, title: string) => () => {
    setSheetMetric({ id: metricId, title });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Dotychczasowe spłaty ({r.pastInstallmentsCount} rat)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Wpłacono łącznie" value={formatPLN(r.pastTotalPaid)} subtitle="Kapitał + odsetki" color="blue"
            onInfo={info('past-total-paid', 'Wpłacono łącznie')} />
          <StatCard title="Spłacony kapitał" value={formatPLN(r.pastPrincipalPaid)} color="gray"
            onInfo={info('past-principal', 'Spłacony kapitał')} />
          <StatCard title="Zapłacone odsetki" value={formatPLN(r.pastInterestTotal)}
            subtitle={`WIBOR: ${formatPLN(r.pastInterestWibor)} | Marża: ${formatPLN(r.pastInterestMargin)}${r.pastInterestBridge > 0 ? ` | Pomostowa: ${formatPLN(r.pastInterestBridge)}` : ''}`}
            color="amber" onInfo={info('past-interest', 'Zapłacone odsetki')} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Rozbicie zapłaconych odsetek</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Odsetki z WIBOR" value={formatPLN(r.pastInterestWibor)} subtitle={`${pctOf(r.pastInterestWibor, r.pastInterestTotal)} całości odsetek`} color="red"
            onInfo={info('interest-wibor', 'Odsetki z WIBOR')} />
          <StatCard title="Odsetki z marży" value={formatPLN(r.pastInterestMargin)} subtitle={`${pctOf(r.pastInterestMargin, r.pastInterestTotal)} całości odsetek`} color="purple"
            onInfo={info('interest-margin', 'Odsetki z marży')} />
          {r.pastInterestBridge > 0 && <StatCard title="Odsetki z marży pomostowej" value={formatPLN(r.pastInterestBridge)} color="gray"
            onInfo={info('interest-bridge', 'Odsetki z marży pomostowej')} />}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Przyszłe spłaty ({r.futureInstallmentsCount} rat)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Do spłaty łącznie" value={formatPLN(r.futureTotalToPay)} subtitle="Przy obecnym WIBOR" color="blue"
            onInfo={info('future-total', 'Do spłaty łącznie')} />
          <StatCard title="Obecna rata" value={formatPLN(r.currentInstallment)} subtitle="Z WIBOR + marża" color="amber"
            onInfo={info('current-installment', 'Obecna rata')} />
          <StatCard title="Przyszłe odsetki" value={formatPLN(r.futureInterestTotal)}
            subtitle={`WIBOR: ${formatPLN(r.futureInterestWibor)} | Marża: ${formatPLN(r.futureInterestMargin)}`} color="gray"
            onInfo={info('future-interest', 'Przyszłe odsetki')} />
        </div>
      </div>

      <div className="bg-green-50 rounded-xl border-2 border-green-300 p-5">
        <h3 className="text-lg font-bold text-green-800 mb-3">Potencjalne roszczenia (eliminacja WIBOR)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Nadpłacone odsetki" value={formatPLN(r.overpaidInterest)} subtitle="Nadpłata wynikająca z naliczania WIBOR" color="green"
            onInfo={info('overpaid-interest', 'Nadpłacone odsetki')} />
          <StatCard title="Oszczędność na przyszłość" value={formatPLN(r.futureSavings)} subtitle="Niższe raty do końca umowy" color="green"
            onInfo={info('future-savings', 'Oszczędność na przyszłość')} />
          <StatCard title="Łączna korzyść" value={formatPLN(r.overpaidInterest + r.futureSavings)} subtitle="Nadpłata + oszczędność" color="green"
            onInfo={info('total-benefit', 'Łączna korzyść')} />
          <StatCard title="Rata bez WIBOR" value={formatPLN(r.installmentNoWibor)} subtitle={`Oszczędność: ${formatPLN(r.currentInstallment - r.installmentNoWibor)}/mies.`} color="green"
            onInfo={info('installment-no-wibor', 'Rata bez WIBOR')} />
        </div>
      </div>

      <Sheet open={sheetMetric !== null} onClose={() => setSheetMetric(null)} title={sheetMetric?.title ?? ''}>
        <CalculationDisclaimer />
        <div className="space-y-4">
          {sheetSteps.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
