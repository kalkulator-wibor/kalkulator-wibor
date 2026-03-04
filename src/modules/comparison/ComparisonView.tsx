import { formatPLN } from '../../utils/formatters';
import { Panel } from '../../components/ui/Panel';
import { useResult } from '../../core/CaseContext';

function Row({ label, withWibor, withoutWibor, highlight }: { label: string; withWibor: number; withoutWibor: number; highlight?: boolean }) {
  const diff = withWibor - withoutWibor;
  return (
    <tr className={highlight ? 'bg-green-50 font-bold' : 'hover:bg-gray-50'}>
      <td className="px-4 py-3 text-gray-700">{label}</td>
      <td className="px-4 py-3 text-right text-gray-800">{formatPLN(withWibor)}</td>
      <td className="px-4 py-3 text-right text-gray-800">{formatPLN(withoutWibor)}</td>
      <td className={`px-4 py-3 text-right font-medium ${diff > 0 ? 'text-green-600' : 'text-gray-500'}`}>
        {diff > 0.01 ? `+${formatPLN(diff)}` : '-'}
      </td>
    </tr>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <tr className="bg-gray-50/50">
      <td colSpan={4} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{children}</td>
    </tr>
  );
}

export default function ComparisonView() {
  const result = useResult();
  if (!result) return null;
  const r = result;

  const rows: { section: string; items: { label: string; w: number; nw: number; hl?: boolean }[] }[] = [
    { section: 'Dotychczasowe spłaty', items: [
      { label: 'Wpłacono łącznie', w: r.pastTotalPaid, nw: r.pastTotalPaidNoWibor },
      { label: 'Zapłacony kapitał', w: r.pastPrincipalPaid, nw: r.pastPrincipalNoWibor },
      { label: 'Zapłacone odsetki', w: r.pastInterestTotal, nw: r.pastInterestNoWibor },
    ]},
    { section: 'Przyszłe spłaty', items: [
      { label: 'Do spłaty łącznie', w: r.futureTotalToPay, nw: r.futureTotalNoWibor },
      { label: 'Przyszłe odsetki', w: r.futureInterestTotal, nw: r.futureInterestNoWibor },
      { label: 'Obecna rata miesięczna', w: r.currentInstallment, nw: r.installmentNoWibor },
    ]},
    { section: 'Podsumowanie', items: [
      { label: 'Całkowity koszt kredytu (kapitał + odsetki)', w: r.pastTotalPaid + r.futureTotalToPay, nw: r.pastTotalPaidNoWibor + r.futureTotalNoWibor, hl: true },
    ]},
  ];

  return (
    <Panel className="overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold text-gray-800">Porównanie: z WIBOR vs bez WIBOR</h3>
        <p className="text-sm text-gray-500 mt-1">Scenariusz eliminacji wskaźnika WIBOR - kredyt oprocentowany wyłącznie marżą banku</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">Pozycja</th>
              <th className="px-4 py-3 text-right text-gray-600 font-medium">Z WIBOR</th>
              <th className="px-4 py-3 text-right text-gray-600 font-medium">Bez WIBOR</th>
              <th className="px-4 py-3 text-right text-green-600 font-medium">Korzyść</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ section, items }) => [
              <SectionHeader key={section}>{section}</SectionHeader>,
              ...items.map(({ label, w, nw, hl }) => (
                <Row key={label} label={label} withWibor={w} withoutWibor={nw} highlight={hl} />
              )),
            ])}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
