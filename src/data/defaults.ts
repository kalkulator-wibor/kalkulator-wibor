import { compareByDate } from '../utils/calculations';
import type { WiborEntry } from '../utils/calculations';
import { WIBOR_3M_RATES } from './wiborRates';

let cached: WiborEntry[] | null = null;

export function getDefaultWiborEntries(): WiborEntry[] {
  if (!cached) {
    cached = Object.entries(WIBOR_3M_RATES)
      .map(([key, rate]) => ({ date: `${key}-01`, rate }))
      .sort(compareByDate);
  }
  return cached;
}
