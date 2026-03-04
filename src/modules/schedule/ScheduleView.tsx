import { useState, useMemo } from 'react';
import type { InstallmentRow } from '../../utils/calculations';
import { formatPLN, formatPercent, formatDate } from '../../utils/formatters';
import { Panel } from '../../components/ui/Panel';
import { InfoIcon } from '../../components/ui/Icons';
import { ToggleGroup } from '../../components/ui/ToggleGroup';
import { Sheet } from '../../components/ui/Sheet';
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
    <Panel className="overflow-hidden">
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800">Harmonogram spłat</h3>
        <ToggleGroup items={filterItems} active={filter} onSelect={setFilter} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Nr', 'Data', 'Rata', 'Kapitał', 'Ods. WIBOR', 'Ods. marża', 'WIBOR', 'Saldo', ''].map((h, i) => (
                <th key={h || 'info'} className={`px-3 py-2 text-gray-600 font-medium ${i < 2 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(row => (
              <tr key={row.number} className={`border-t ${row.isPast ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50'}`}>
                <td className="px-3 py-2 text-gray-500">{row.number}</td>
                <td className="px-3 py-2 text-gray-800">{formatDate(row.date)}</td>
                <td className="px-3 py-2 text-right font-medium text-gray-800">{formatPLN(row.installment)}</td>
                <td className="px-3 py-2 text-right text-gray-700">{formatPLN(row.principal)}</td>
                <td className="px-3 py-2 text-right text-red-600">{formatPLN(row.interestWibor)}</td>
                <td className="px-3 py-2 text-right text-purple-600">{formatPLN(row.interestMargin)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatPercent(row.wiborRate)}</td>
                <td className="px-3 py-2 text-right font-medium text-gray-800">{formatPLN(row.remainingBalance)}</td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => setSelectedRow(row)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                    aria-label={`Szczegóły raty ${row.number}`}
                  >
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="p-4 border-t text-center">
          <button onClick={() => setShowAll(!showAll)} className="text-blue-600 hover:text-blue-800 font-medium text-sm cursor-pointer">
            {showAll ? 'Pokaż mniej' : `Pokaż wszystkie ${filtered.length} rat`}
          </button>
        </div>
      )}

      <Sheet open={selectedRow !== null} onClose={() => setSelectedRow(null)}
        title={selectedRow ? `Rata nr ${selectedRow.number}` : ''}>
        {selectedRow && (
          <InstallmentExplainer row={selectedRow} schedule={schedule} input={input} />
        )}
      </Sheet>
    </Panel>
  );
}
