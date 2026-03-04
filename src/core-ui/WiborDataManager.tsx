import { useState, useMemo } from 'react';
import { formatPercent } from '../utils/formatters';
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

function ValidationCard({ v, label }: { v: ValidationResult; label?: string }) {
  return (
    <>
      <div className="stats stats-vertical sm:stats-horizontal shadow w-full mb-4 text-sm">
        <div className="stat py-3 px-4">
          <div className="stat-title text-xs">Wpisów</div>
          <div className="stat-value text-lg">{v.totalEntries}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-title text-xs">Zakres</div>
          <div className="stat-value text-sm">{v.dateRange}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-title text-xs">Status</div>
          <div className={`stat-value text-sm ${v.isValid ? 'text-success' : 'text-error'}`}>{v.isValid ? (label || 'OK') : 'Błędy'}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-title text-xs">{label ? 'Luki' : 'Ostrzeżenia'}</div>
          <div className="stat-value text-lg">{label ? v.gaps.length : v.warnings.length}</div>
        </div>
      </div>
      {v.errors.length > 0 && <div className="mb-3">{v.errors.map((msg, i) => <div key={i} className="alert alert-error text-sm mb-1">{msg}</div>)}</div>}
      {v.warnings.length > 0 && <div className="mb-3">{v.warnings.map((msg, i) => <div key={i} className="alert alert-warning text-sm mb-1">{msg}</div>)}</div>}
      {!label && v.gaps.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium opacity-60 mb-1">Luki w danych:</p>
          {v.gaps.map((g, i) => <p key={i} className="text-xs opacity-50 pl-3">{g}</p>)}
        </div>
      )}
    </>
  );
}

function RateTable({ data }: { data: WiborEntry[] }) {
  return (
    <div className="overflow-x-auto max-h-80 overflow-y-auto">
      <table className="table table-sm">
        <thead className="sticky top-0 bg-base-200">
          <tr>
            <th>Data</th>
            <th className="text-right">WIBOR 3M</th>
            <th className="text-right">Zmiana</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, i) => {
            const diff = entry.rate - (i > 0 ? data[i - 1].rate : entry.rate);
            const isForecast = entry.date.slice(0, 7) > WIBOR_LAST_ACTUAL;
            return (
              <tr key={entry.date} className={isForecast ? 'italic opacity-40' : ''}>
                <td>{entry.date}{isForecast && <span className="badge badge-warning badge-xs ml-1 not-italic">prognoza</span>}</td>
                <td className="text-right font-medium">{formatPercent(entry.rate)}</td>
                <td className={`text-right text-xs ${diff > 0 ? 'text-error' : diff < 0 ? 'text-success' : 'opacity-40'}`}>
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

interface Props {
  wiborData: WiborEntry[];
  onDataUpdate: (data: WiborEntry[]) => void;
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

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">Aktualne dane WIBOR 3M</h3>
          <ValidationCard v={currentValidation} />
          <RateTable data={wiborData} />
          <div className="card-actions mt-4">
            <button onClick={() => downloadFile(JSON.stringify(wiborData, null, 2), 'application/json', 'json')} className="btn btn-sm">Eksport JSON</button>
            <button onClick={() => {
              const rows = wiborData.map(e => `${e.date},${e.rate},${e.rate},${e.rate},${e.rate}`).join('\n');
              downloadFile('Data,Otwarcie,Najwyzszy,Najnizszy,Zamkniecie\n' + rows, 'text/csv', 'csv');
            }} className="btn btn-sm">Eksport CSV</button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">Pobierz z API (stooq.pl)</h3>
          <p className="text-sm opacity-60">Pobiera historyczne stawki WIBOR 3M miesięcznie z serwisu stooq.pl (dane zamknięcia miesiąca).</p>
          <div className="flex gap-3 items-center">
            <button onClick={handleFetch} disabled={fetchStatus === 'loading'} className="btn btn-primary">
              {fetchStatus === 'loading' ? <span className="loading loading-spinner loading-sm"></span> : null}
              {fetchStatus === 'loading' ? 'Pobieranie...' : 'Pobierz dane'}
            </button>
            <a href={STOOQ_URL} target="_blank" rel="noopener noreferrer" className="link link-primary text-sm">Pobierz CSV ręcznie</a>
          </div>
          {fetchStatus === 'error' && (
            <div className="alert alert-error text-sm">
              <div>
                <p>{fetchError}</p>
                <p className="text-xs mt-1 opacity-70">Alternatywnie: kliknij "Pobierz CSV ręcznie", zapisz plik, i użyj importu poniżej.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title">Import danych</h3>
          <p className="text-sm opacity-60">Wgraj plik CSV (format stooq.pl) lub JSON (eksport kalkulatora).</p>
          <label className="btn btn-neutral w-fit">
            Wybierz plik (.csv / .json)
            <input type="file" accept=".csv,.json" onChange={handleFileImport} className="hidden" />
          </label>
          {importError && <div className="alert alert-error text-sm">{importError}</div>}
        </div>
      </div>

      {previewData && validation && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Podgląd danych</h3>
              <button onClick={handleApply} disabled={!validation.isValid} className="btn btn-success">
                Zastosuj dane ({previewData.length} wpisów)
              </button>
            </div>
            <ValidationCard v={validation} label="OK - można zastosować" />
            <RateTable data={previewData} />
          </div>
        </div>
      )}
    </div>
  );
}
