import { useState, useMemo } from 'react';
import { formatPercent } from '../utils/formatters';
import { Panel } from '../components/ui/Panel';
import type { WiborEntry } from '../utils/calculations';
import {
  STOOQ_URL,
  parseStooqCsv,
  parseJson,
  validateData,
  downloadFile,
} from './wiborDataService';
import { WIBOR_LAST_ACTUAL } from '../data/wiborRates';
import type { ValidationResult } from './wiborDataService';

interface Props {
  wiborData: WiborEntry[];
  onDataUpdate: (data: WiborEntry[]) => void;
}

function ValidationCard({ v, label }: { v: ValidationResult; label?: string }) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Wpisów</p>
          <p className="text-lg font-bold text-gray-800">{v.totalEntries}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Zakres</p>
          <p className="text-sm font-medium text-gray-800">{v.dateRange}</p>
        </div>
        <div className={`rounded-lg p-3 ${v.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500">Status</p>
          <p className={`text-sm font-bold ${v.isValid ? 'text-green-700' : 'text-red-700'}`}>
            {v.isValid ? (label || 'OK') : 'Błędy'}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${v.warnings.length > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-500">{label ? 'Luki' : 'Ostrzeżenia'}</p>
          <p className="text-sm font-bold text-gray-800">{label ? v.gaps.length : v.warnings.length}</p>
        </div>
      </div>
      {v.errors.length > 0 && <MessageList items={v.errors} color="red" />}
      {v.warnings.length > 0 && <MessageList items={v.warnings} color="amber" />}
      {!label && v.gaps.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Luki w danych:</p>
          {v.gaps.map((g, i) => <p key={i} className="text-xs text-gray-500 pl-3">{g}</p>)}
        </div>
      )}
    </>
  );
}

const messageColors = {
  red:   'text-red-700 bg-red-50',
  amber: 'text-amber-700 bg-amber-50',
} as const;

function MessageList({ items, color }: { items: string[]; color: 'red' | 'amber' }) {
  return (
    <div className="mb-3">
      {items.map((msg, i) => (
        <p key={i} className={`text-sm ${messageColors[color]} rounded px-3 py-1 mb-1`}>{msg}</p>
      ))}
    </div>
  );
}

function RateTable({ data }: { data: WiborEntry[] }) {
  return (
    <div className="overflow-x-auto max-h-80 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-gray-600 font-medium">Data</th>
            <th className="px-3 py-2 text-right text-gray-600 font-medium">WIBOR 3M</th>
            <th className="px-3 py-2 text-right text-gray-600 font-medium">Zmiana</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, i) => {
            const diff = entry.rate - (i > 0 ? data[i - 1].rate : entry.rate);
            const isForecast = entry.date.slice(0, 7) > WIBOR_LAST_ACTUAL;
            return (
              <tr key={entry.date} className={`border-t hover:bg-gray-50 ${isForecast ? 'italic text-gray-400' : ''}`}>
                <td className="px-3 py-1.5">{entry.date}{isForecast && <span className="ml-1 text-[10px] text-amber-500 not-italic">(prognoza)</span>}</td>
                <td className="px-3 py-1.5 text-right font-medium">{formatPercent(entry.rate)}</td>
                <td className={`px-3 py-1.5 text-right text-xs ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)} pp` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function WiborDataManager({ wiborData, onDataUpdate }: Props) {
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchError, setFetchError] = useState('');
  const [previewData, setPreviewData] = useState<WiborEntry[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importError, setImportError] = useState('');

  const currentValidation = useMemo(() => validateData(wiborData), [wiborData]);

  const handleFetch = async () => {
    setFetchStatus('loading');
    setFetchError('');
    setPreviewData(null);
    try {
      const response = await fetch(STOOQ_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const entries = parseStooqCsv(await response.text());
      if (entries.length === 0) throw new Error('Nie udało się sparsować danych CSV');
      setPreviewData(entries);
      setValidation(validateData(entries));
      setFetchStatus('success');
    } catch (err: any) {
      setFetchStatus('error');
      setFetchError(err.message.includes('fetch')
        ? 'Błąd CORS - stooq.pl blokuje zapytania z przeglądarki. Pobierz plik ręcznie i użyj importu.'
        : err.message);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const entries = file.name.endsWith('.json') ? parseJson(text) : parseStooqCsv(text);
        if (entries.length === 0) { setImportError('Nie udało się odczytać danych z pliku. Sprawdź format.'); return; }
        setPreviewData(entries);
        setValidation(validateData(entries));
        setFetchStatus('success');
      } catch (err: any) { setImportError(`Błąd parsowania: ${err.message}`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApply = () => {
    if (!previewData) return;
    onDataUpdate(previewData);
    setPreviewData(null);
    setValidation(null);
    setFetchStatus('idle');
  };

  const btnClass = "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium cursor-pointer";

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Aktualne dane WIBOR 3M</h3>
        <ValidationCard v={currentValidation} />
        <RateTable data={wiborData} />
        <div className="flex gap-2 mt-4">
          <button onClick={() => downloadFile(JSON.stringify(wiborData, null, 2), 'application/json', 'json')} className={btnClass}>Eksport JSON</button>
          <button onClick={() => {
            const rows = wiborData.map(e => `${e.date},${e.rate},${e.rate},${e.rate},${e.rate}`).join('\n');
            downloadFile('Data,Otwarcie,Najwyzszy,Najnizszy,Zamkniecie\n' + rows, 'text/csv', 'csv');
          }} className={btnClass}>Eksport CSV</button>
        </div>
      </Panel>

      <Panel className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Pobierz z API (stooq.pl)</h3>
        <p className="text-sm text-gray-500 mb-4">Pobiera historyczne stawki WIBOR 3M miesięcznie z serwisu stooq.pl (dane zamknięcia miesiąca).</p>
        <div className="flex gap-3 items-center mb-4">
          <button onClick={handleFetch} disabled={fetchStatus === 'loading'}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium cursor-pointer disabled:cursor-not-allowed">
            {fetchStatus === 'loading' ? 'Pobieranie...' : 'Pobierz dane'}
          </button>
          <a href={STOOQ_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 underline">Pobierz CSV ręcznie</a>
        </div>
        {fetchStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{fetchError}</p>
            <p className="text-xs text-red-500 mt-1">Alternatywnie: kliknij "Pobierz CSV ręcznie", zapisz plik, i użyj importu poniżej.</p>
          </div>
        )}
      </Panel>

      <Panel className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Import danych</h3>
        <p className="text-sm text-gray-500 mb-4">Wgraj plik CSV (format stooq.pl) lub JSON (eksport kalkulatora).</p>
        <label className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium cursor-pointer inline-block">
          Wybierz plik (.csv / .json)
          <input type="file" accept=".csv,.json" onChange={handleFileImport} className="hidden" />
        </label>
        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-red-700">{importError}</p>
          </div>
        )}
      </Panel>

      {previewData && validation && (
        <Panel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Podgląd danych</h3>
            <button onClick={handleApply} disabled={!validation.isValid}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-bold cursor-pointer disabled:cursor-not-allowed">
              Zastosuj dane ({previewData.length} wpisów)
            </button>
          </div>
          <ValidationCard v={validation} label="OK - można zastosować" />
          <RateTable data={previewData} />
        </Panel>
      )}
    </div>
  );
}
