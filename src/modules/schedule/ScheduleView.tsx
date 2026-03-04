import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import type { InstallmentRow } from '../../utils/calculations';
import { formatPLN, formatPercent, formatDate } from '../../utils/formatters';
import InstallmentExplainer from './InstallmentExplainer';
import { useResult, useInput } from '../../core/CaseContext';
import { scheduleFilters } from './scheduleFilters';

const PAGE_SIZE = 24;

export default function ScheduleView() {
  const result = useResult();
  const input = useInput();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedRow, setSelectedRow] = useState<InstallmentRow | null>(null);

  const schedule = result?.schedule ?? [];

  const { filtered, filterItems } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of scheduleFilters) counts[f.id] = 0;
    for (const row of schedule) {
      for (const f of scheduleFilters) { if (f.test(row)) counts[f.id]++; }
    }
    const activeFilter = scheduleFilters.find(f => f.id === filter) ?? scheduleFilters[0];
    return {
      filtered: schedule.filter(activeFilter.test),
      filterItems: scheduleFilters.map(f => ({ id: f.id, label: `${f.label} (${counts[f.id]})` })),
    };
  }, [schedule, filter]);

  const displayed = showAll ? filtered : filtered.slice(0, PAGE_SIZE);

  if (!result || !input) return null;

  return (
    <div className="card bg-base-100 shadow-xl overflow-hidden">
      <div className="card-body pb-0 flex-row flex-wrap items-center justify-between gap-3">
        <h3 className="card-title">Harmonogram spłat</h3>
        <div role="tablist" className="tabs tabs-boxed tabs-sm">
          {filterItems.map(f => (
            <button key={f.id} role="tab" onClick={() => setFilter(f.id)}
              className={`tab ${filter === f.id ? 'tab-active' : ''}`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              {['Nr', 'Data', 'Rata', 'Kapitał', 'Ods. WIBOR', 'Ods. marża', 'WIBOR', 'Saldo', ''].map((h, i) => (
                <th key={h || 'info'} className={i >= 2 ? 'text-right' : ''}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(row => (
              <tr key={row.number} className={row.isPast ? '' : 'opacity-60'}>
                <td>{row.number}</td>
                <td>{formatDate(row.date)}</td>
                <td className="text-right font-medium">{formatPLN(row.installment)}</td>
                <td className="text-right">{formatPLN(row.principal)}</td>
                <td className="text-right text-error">{formatPLN(row.interestWibor)}</td>
                <td className="text-right text-primary">{formatPLN(row.interestMargin)}</td>
                <td className="text-right opacity-50">{formatPercent(row.wiborRate)}</td>
                <td className="text-right font-medium">{formatPLN(row.remainingBalance)}</td>
                <td>
                  <button onClick={() => setSelectedRow(row)} className="btn btn-ghost btn-xs btn-circle" aria-label={`Szczegóły raty ${row.number}`}>
                    <Info className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="card-body pt-2">
          <button onClick={() => setShowAll(!showAll)} className="btn btn-link btn-sm">
            {showAll ? 'Pokaż mniej' : `Pokaż wszystkie ${filtered.length} rat`}
          </button>
        </div>
      )}

      {selectedRow && (
        <div className="drawer drawer-end open">
          <input type="checkbox" className="drawer-toggle" checked readOnly />
          <div className="drawer-side z-50">
            <label className="drawer-overlay" onClick={() => setSelectedRow(null)}></label>
            <div className="bg-base-100 min-h-full w-[520px] max-w-[90vw] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
                <h2 className="text-lg font-bold">Rata nr {selectedRow.number}</h2>
                <button onClick={() => setSelectedRow(null)} className="btn btn-ghost btn-sm btn-circle">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <InstallmentExplainer row={selectedRow} schedule={schedule} input={input} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
