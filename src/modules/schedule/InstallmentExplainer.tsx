import { useMemo } from 'react';
import type { InstallmentRow, LoanInput } from '../../utils/calculations';
import { generateExplanation } from '../../utils/explanations';
import { StepCard } from '../../components/ui/ExplanationCard';
import { CalculationDisclaimer } from '../../components/ui/CalculationDisclaimer';

interface Props {
  row: InstallmentRow;
  schedule: InstallmentRow[];
  input: LoanInput;
}

export default function InstallmentExplainer({ row, schedule, input }: Props) {
  const explanation = useMemo(
    () => generateExplanation(row, schedule, input),
    [row, schedule, input],
  );

  return (
    <div className="space-y-4">
      <CalculationDisclaimer />
      <div className="text-sm text-gray-500">
        Rata nr <span className="font-bold text-gray-800">{explanation.installmentNumber}</span>
        {' '}z dnia <span className="font-bold text-gray-800">{explanation.date}</span>
      </div>

      {explanation.steps.map((step, i) => (
        <StepCard key={step.id} step={step} index={i} />
      ))}
    </div>
  );
}
