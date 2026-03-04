import type { InstallmentRow } from '../../utils/calculations';

export const scheduleFilters = [
  { id: 'all', label: 'Wszystkie', test: (_r: InstallmentRow) => true },
  { id: 'past', label: 'Przeszłe', test: (r: InstallmentRow) => r.isPast },
  { id: 'future', label: 'Przyszłe', test: (r: InstallmentRow) => !r.isPast },
] as const;
