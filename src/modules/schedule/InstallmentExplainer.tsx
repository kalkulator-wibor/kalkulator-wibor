import { useMemo } from 'react';
import type { InstallmentRow, LoanInput } from '../../utils/calculations';
import type { ExplanationStep, NamedValue } from '../../utils/explanationTypes';
import { generateExplanation } from '../../utils/explanations';

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

interface Props { row: InstallmentRow; schedule: InstallmentRow[]; input: LoanInput; }

export default function InstallmentExplainer({ row, schedule, input }: Props) {
  const explanation = useMemo(() => generateExplanation(row, schedule, input), [row, schedule, input]);

  return (
    <div className="space-y-4">
      <div className="alert alert-info text-xs">
        <div>
          <p className="font-medium mb-1">Jak czytać te obliczenia?</p>
          <p>Poniżej przedstawiamy krok po kroku jak wyliczono daną wartość — wzór, dane wejściowe i wynik.</p>
        </div>
      </div>
      <div className="text-sm opacity-60">
        Rata nr <span className="font-bold opacity-100">{explanation.installmentNumber}</span>
        {' '}z dnia <span className="font-bold opacity-100">{explanation.date}</span>
      </div>
      {explanation.steps.map((step, i) => <StepCard key={step.id} step={step} index={i} />)}
    </div>
  );
}
