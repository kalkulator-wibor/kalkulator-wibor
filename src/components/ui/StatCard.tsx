import { InfoIcon } from './Icons';

export type StatCardColor = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray';

const colorMap: Record<StatCardColor, { bg: string; text: string }> = {
  blue:   { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
  green:  { bg: 'bg-green-50 border-green-200',  text: 'text-green-700' },
  red:    { bg: 'bg-red-50 border-red-200',      text: 'text-red-700' },
  amber:  { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700' },
  purple: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  gray:   { bg: 'bg-gray-50 border-gray-200',    text: 'text-gray-700' },
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: StatCardColor;
  onInfo?: () => void;
}

export function StatCard({ title, value, subtitle, color, onInfo }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border-2 p-4 ${c.bg} relative`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {onInfo && (
          <button
            onClick={onInfo}
            className="p-0.5 rounded hover:bg-black/5 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
            aria-label={`Wyjaśnienie: ${title}`}
          >
            <InfoIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
