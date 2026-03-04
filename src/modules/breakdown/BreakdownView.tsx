import { formatPLN, formatPercent } from '../../utils/formatters';
import { Panel } from '../../components/ui/Panel';
import { useResult } from '../../core/CaseContext';

function BarSegment({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm text-gray-600 shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div className={`h-full rounded-full ${color} flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 2)}%` }}>
          {pct > 15 && <span className="text-xs text-white font-medium">{formatPercent(pct, 1)}</span>}
        </div>
      </div>
      <div className="w-32 text-right text-sm font-medium text-gray-800 shrink-0">{formatPLN(value)}</div>
    </div>
  );
}

function InterestSection({ title, segments, total, border }: {
  title: string; segments: { label: string; value: number; color: string }[]; total: number; border?: boolean;
}) {
  return (
    <div className={border ? 'border-t pt-4' : ''}>
      <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2">
        {segments.map(s => <BarSegment key={s.label + s.color} label={s.label} value={s.value} total={total} color={s.color} />)}
      </div>
      <div className={`mt-2 text-right text-sm ${border ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
        Łącznie: {formatPLN(total)}
      </div>
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
    <Panel className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Struktura odsetek</h3>
        <p className="text-sm text-gray-500">Rozbicie odsetek na część wynikającą z WIBOR i z marży banku</p>
      </div>

      <InterestSection title="Odsetki zapłacone (do dziś)" total={r.pastInterestTotal} segments={[
        { label: 'WIBOR', value: r.pastInterestWibor, color: 'bg-red-500' },
        { label: 'Marża', value: r.pastInterestMargin, color: 'bg-purple-500' },
        ...(r.pastInterestBridge > 0 ? [{ label: 'Pomostowa', value: r.pastInterestBridge, color: 'bg-gray-400' }] : []),
      ]} />

      {r.futureInterestTotal > 0 && (
        <InterestSection title="Odsetki przyszłe (prognoza)" total={r.futureInterestTotal} segments={[
          { label: 'WIBOR', value: r.futureInterestWibor, color: 'bg-red-300' },
          { label: 'Marża', value: r.futureInterestMargin, color: 'bg-purple-300' },
        ]} />
      )}

      <InterestSection border title="Łączne odsetki za cały okres kredytu" total={totalInterest} segments={[
        { label: 'WIBOR', value: totalWibor, color: 'bg-red-500' },
        { label: 'Marża', value: totalMargin, color: 'bg-purple-500' },
      ]} />
    </Panel>
  );
}
