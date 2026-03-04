import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { formatPLN } from '../../utils/formatters';
import { getSummaryExplanation } from '../../utils/explanations/summaryExplanations';
import type { ExplanationStep, NamedValue } from '../../utils/explanationTypes';
import { useResult } from '../../core/CaseContext';
import { pctOf } from './summaryHelpers';

function Stat({ title, value, subtitle, onInfo }: { title: string; value: string; subtitle?: string; onInfo?: () => void }) {
  return (
    <div className="stat bg-base-100 rounded-box shadow-sm px-5 py-4">
      <div className="stat-title flex justify-between items-start">
        {title}
        {onInfo && <button onClick={onInfo} className="btn btn-ghost btn-xs btn-circle"><Info className="w-4 h-4" /></button>}
      </div>
      <div className="stat-value text-2xl">{value}</div>
      {subtitle && <div className="stat-desc">{subtitle}</div>}
    </div>
  );
}

function ValuePill({ nv }: { nv: NamedValue }) {
  return (
    <span className="badge badge-lg gap-2">
      <span className="font-mono font-medium text-primary">{nv.symbol}</span>=<span className="font-medium">{nv.formatted}</span>
      {nv.source && <span className="text-xs opacity-50">({nv.source})</span>}
    </span>
  );
}

function StepCard({ step, index }: { step: ExplanationStep; index: number }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4 gap-3">
        <div className="flex items-center gap-3">
          <span className="badge badge-primary badge-sm font-bold">{index + 1}</span>
          <h4 className="font-bold">{step.title}</h4>
        </div>
        <div className="bg-primary/10 rounded-lg px-4 py-2.5">
          <p className="text-xs font-medium text-primary mb-1">Wzór</p>
          <p className="font-mono text-sm">{step.formula}</p>
        </div>
        <div>
          <p className="text-xs font-medium opacity-60 mb-2">Dane wejściowe</p>
          <div className="flex flex-wrap gap-2">{step.inputs.map(nv => <ValuePill key={nv.symbol} nv={nv} />)}</div>
        </div>
        <div className="bg-success/10 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-success">Wynik</p>
            <p className="font-mono text-sm">{step.result.symbol} = {step.result.formatted}</p>
          </div>
          {step.result.source && <span className="text-xs text-success">{step.result.source}</span>}
        </div>
        {step.notes && <p className="text-xs opacity-50 italic border-l-2 border-base-300 pl-3">{step.notes}</p>}
      </div>
    </div>
  );
}

export default function SummaryView() {
  const result = useResult();
  const [sheetMetric, setSheetMetric] = useState<{ id: string; title: string } | null>(null);

  const sheetSteps = useMemo(
    () => sheetMetric && result ? getSummaryExplanation(sheetMetric.id, result) : [],
    [sheetMetric, result],
  );

  if (!result) return null;
  const r = result;
  const info = (metricId: string, title: string) => () => setSheetMetric({ id: metricId, title });

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-bold text-lg mb-3">Dotychczasowe spłaty ({r.pastInstallmentsCount} rat)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat title="Wpłacono łącznie" value={formatPLN(r.pastTotalPaid)} subtitle="Kapitał + odsetki" onInfo={info('past-total-paid', 'Wpłacono łącznie')} />
          <Stat title="Spłacony kapitał" value={formatPLN(r.pastPrincipalPaid)} onInfo={info('past-principal', 'Spłacony kapitał')} />
          <Stat title="Zapłacone odsetki" value={formatPLN(r.pastInterestTotal)}
            subtitle={`WIBOR: ${formatPLN(r.pastInterestWibor)} | Marża: ${formatPLN(r.pastInterestMargin)}${r.pastInterestBridge > 0 ? ` | Pomostowa: ${formatPLN(r.pastInterestBridge)}` : ''}`}
            onInfo={info('past-interest', 'Zapłacone odsetki')} />
        </div>
      </section>

      <section>
        <h3 className="font-bold text-lg mb-3">Rozbicie zapłaconych odsetek</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat title="Odsetki z WIBOR" value={formatPLN(r.pastInterestWibor)} subtitle={`${pctOf(r.pastInterestWibor, r.pastInterestTotal)} całości odsetek`} onInfo={info('interest-wibor', 'Odsetki z WIBOR')} />
          <Stat title="Odsetki z marży" value={formatPLN(r.pastInterestMargin)} subtitle={`${pctOf(r.pastInterestMargin, r.pastInterestTotal)} całości odsetek`} onInfo={info('interest-margin', 'Odsetki z marży')} />
          {r.pastInterestBridge > 0 && <Stat title="Odsetki z marży pomostowej" value={formatPLN(r.pastInterestBridge)} onInfo={info('interest-bridge', 'Odsetki z marży pomostowej')} />}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-lg mb-3">Przyszłe spłaty ({r.futureInstallmentsCount} rat)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat title="Do spłaty łącznie" value={formatPLN(r.futureTotalToPay)} subtitle="Przy obecnym WIBOR" onInfo={info('future-total', 'Do spłaty łącznie')} />
          <Stat title="Obecna rata" value={formatPLN(r.currentInstallment)} subtitle="Z WIBOR + marża" onInfo={info('current-installment', 'Obecna rata')} />
          <Stat title="Przyszłe odsetki" value={formatPLN(r.futureInterestTotal)}
            subtitle={`WIBOR: ${formatPLN(r.futureInterestWibor)} | Marża: ${formatPLN(r.futureInterestMargin)}`} onInfo={info('future-interest', 'Przyszłe odsetki')} />
        </div>
      </section>

      <div className="divider"></div>

      <section>
        <h3 className="font-bold text-lg mb-3 text-success">Potencjalne roszczenia (eliminacja WIBOR)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat title="Nadpłacone odsetki" value={formatPLN(r.overpaidInterest)} subtitle="Nadpłata wynikająca z naliczania WIBOR" onInfo={info('overpaid-interest', 'Nadpłacone odsetki')} />
          <Stat title="Oszczędność na przyszłość" value={formatPLN(r.futureSavings)} subtitle="Niższe raty do końca umowy" onInfo={info('future-savings', 'Oszczędność na przyszłość')} />
          <Stat title="Łączna korzyść" value={formatPLN(r.overpaidInterest + r.futureSavings)} subtitle="Nadpłata + oszczędność" onInfo={info('total-benefit', 'Łączna korzyść')} />
          <Stat title="Rata bez WIBOR" value={formatPLN(r.installmentNoWibor)} subtitle={`Oszczędność: ${formatPLN(r.currentInstallment - r.installmentNoWibor)}/mies.`} onInfo={info('installment-no-wibor', 'Rata bez WIBOR')} />
        </div>
      </section>

      {sheetMetric && (
        <div className="drawer drawer-end open">
          <input type="checkbox" className="drawer-toggle" checked readOnly />
          <div className="drawer-side z-50">
            <label className="drawer-overlay" onClick={() => setSheetMetric(null)}></label>
            <div className="bg-base-100 min-h-full w-[520px] max-w-[90vw] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
                <h2 className="text-lg font-bold">{sheetMetric.title}</h2>
                <button onClick={() => setSheetMetric(null)} className="btn btn-ghost btn-sm btn-circle">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="alert alert-info mb-4 text-xs">
                  <div>
                    <p className="font-medium mb-1">Jak czytać te obliczenia?</p>
                    <p>Poniżej przedstawiamy krok po kroku jak wyliczono daną wartość — wzór, dane wejściowe i wynik.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {sheetSteps.map((step, i) => <StepCard key={step.id} step={step} index={i} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
