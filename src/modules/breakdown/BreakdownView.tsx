import { formatPLN, formatPercent } from '../../utils/formatters';
import { useResult } from '../../core/CaseContext';

function BarSegment({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm opacity-60 shrink-0">{label}</div>
      <progress className={`progress ${color} flex-1`} value={pct} max="100"></progress>
      <div className="w-32 text-right text-sm font-medium shrink-0">
        {formatPLN(value)} <span className="opacity-40 text-xs">({formatPercent(pct, 1)})</span>
      </div>
    </div>
  );
}

function InterestSection({ title, segments, total, border }: {
  title: string; segments: { label: string; value: number; color: string }[]; total: number; border?: boolean;
}) {
  return (
    <div className={border ? 'border-t border-base-300 pt-4' : ''}>
      <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3">{title}</h4>
      <div className="space-y-2">
        {segments.map(s => <BarSegment key={s.label + s.color} label={s.label} value={s.value} total={total} color={s.color} />)}
      </div>
      <div className={`mt-2 text-right text-sm ${border ? 'font-medium' : 'opacity-50'}`}>Łącznie: {formatPLN(total)}</div>
    </div>
  );
}

export default function BreakdownView() {
  const result = useResult();
  if (!result) return null;
  const r = result;

  const totalWibor = r.pastInterestWibor + r.futureInterestWibor;
  const totalMargin = r.pastInterestMargin + r.futureInterestMargin;
  const totalInterest = r.pastInterestTotal + r.futureInterestTotal;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body gap-6">
        <div>
          <h3 className="card-title">Struktura odsetek</h3>
          <p className="text-sm opacity-60">Rozbicie odsetek na część wynikającą z WIBOR i z marży banku</p>
        </div>

        <InterestSection title="Odsetki zapłacone (do dziś)" total={r.pastInterestTotal} segments={[
          { label: 'WIBOR', value: r.pastInterestWibor, color: 'progress-error' },
          { label: 'Marża', value: r.pastInterestMargin, color: 'progress-primary' },
          ...(r.pastInterestBridge > 0 ? [{ label: 'Pomostowa', value: r.pastInterestBridge, color: 'progress-warning' }] : []),
        ]} />

        {r.futureInterestTotal > 0 && (
          <InterestSection title="Odsetki przyszłe (prognoza)" total={r.futureInterestTotal} segments={[
            { label: 'WIBOR', value: r.futureInterestWibor, color: 'progress-error' },
            { label: 'Marża', value: r.futureInterestMargin, color: 'progress-primary' },
          ]} />
        )}

        <InterestSection border title="Łączne odsetki za cały okres kredytu" total={totalInterest} segments={[
          { label: 'WIBOR', value: totalWibor, color: 'progress-error' },
          { label: 'Marża', value: totalMargin, color: 'progress-primary' },
        ]} />
      </div>
    </div>
  );
}
