import { compareByDate } from '../utils/calculations';
import type { WiborEntry } from '../utils/calculations';
import { toDateString } from '../utils/formatters';

export interface ValidationResult {
  isValid: boolean;
  totalEntries: number;
  dateRange: string;
  gaps: string[];
  warnings: string[];
  errors: string[];
}

export const STOOQ_URL = 'https://stooq.pl/q/d/l/?s=plopln3m&d1=20050101&d2=20261231&i=m';

export function parseStooqCsv(csv: string): WiborEntry[] {
  return csv.trim().split('\n').slice(1)
    .map(line => {
      const parts = line.trim().split(',');
      if (parts.length < 5) return null;
      const rate = parseFloat(parts[4].trim());
      return parts[0].trim() && !isNaN(rate) ? { date: parts[0].trim(), rate } : null;
    })
    .filter((e): e is WiborEntry => e !== null)
    .sort(compareByDate);
}

export function parseJson(json: string): WiborEntry[] {
  const data = JSON.parse(json);
  if (Array.isArray(data)) {
    return data.filter((e: any) => e.date && typeof e.rate === 'number')
      .sort((a: WiborEntry, b: WiborEntry) => a.date.localeCompare(b.date));
  }
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => ({ date: key.length === 7 ? `${key}-01` : key, rate: value as number }))
      .sort(compareByDate);
  }
  return [];
}

export function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function validateData(entries: WiborEntry[]): ValidationResult {
  if (entries.length === 0) {
    return { isValid: false, totalEntries: 0, dateRange: '-', gaps: [], warnings: [], errors: ['Brak danych'] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const gaps: string[] = [];

  for (const entry of entries) {
    if (entry.rate < 0) errors.push(`Ujemna stawka: ${entry.date} = ${entry.rate}%`);
    if (entry.rate > 15) warnings.push(`Bardzo wysoka stawka: ${entry.date} = ${entry.rate}%`);
  }

  for (let i = 1; i < entries.length; i++) {
    const diff = monthDiff(new Date(entries[i - 1].date), new Date(entries[i].date));
    if (diff > 2) gaps.push(`Luka: ${entries[i - 1].date} → ${entries[i].date} (${diff} mies.)`);
  }

  if (gaps.length > 0) warnings.push(`Znaleziono ${gaps.length} luk w danych`);

  const lastDate = entries[entries.length - 1].date;
  if (monthDiff(new Date(lastDate), new Date()) > 2) {
    warnings.push(`Dane mogą być nieaktualne - ostatni wpis: ${lastDate}`);
  }

  return {
    isValid: errors.length === 0,
    totalEntries: entries.length,
    dateRange: `${entries[0].date} → ${lastDate}`,
    gaps, warnings, errors,
  };
}

export function downloadFile(content: string, type: string, ext: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wibor3m_${toDateString(new Date())}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
