import { formatPercent } from '../../utils/formatters';

export function pctOf(part: number, total: number): string {
  return formatPercent(total > 0 ? (part / total) * 100 : 0, 1);
}
