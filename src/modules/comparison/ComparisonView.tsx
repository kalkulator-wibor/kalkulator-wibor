import { formatPLN } from '../../utils/formatters';
import { useResult } from '../../core/CaseContext';

function Row({ label, withWibor, withoutWibor, highlight }: { label: string; withWibor: number; withoutWibor: number; highlight?: boolean }) {
  const diff = withWibor - withoutWibor;
  return (
    <tr className={highlight ? 'bg-success/10 font-bold' : 'hover'}>
      <td>{label}</td>
      <td className="text-right">{formatPLN(withWibor)}</td>
      <td className="text-right">{formatPLN(withoutWibor)}</td>
      <td className="text-right">
        {diff > 0.01 ? <span className="badge badge-success badge-sm">+{formatPLN(diff)}</span> : <span className="opacity-40">-</span>}
      </td>
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
    <div className="card bg-base-100 shadow-xl overflow-hidden">
      <div className="card-body pb-0">
        <h3 className="card-title">Porównanie: z WIBOR vs bez WIBOR</h3>
        <p className="text-sm opacity-60">Scenariusz eliminacji wskaźnika WIBOR - kredyt oprocentowany wyłącznie marżą banku</p>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Pozycja</th>
              <th className="text-right">Z WIBOR</th>
              <th className="text-right">Bez WIBOR</th>
              <th className="text-right text-success">Korzyść</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ section, items }) => [
              <tr key={section} className="bg-base-200/50">
                <td colSpan={4} className="text-xs font-bold uppercase tracking-wider opacity-60">{section}</td>
              </tr>,
              ...items.map(({ label, w, nw, hl }) => (
                <Row key={label} label={label} withWibor={w} withoutWibor={nw} highlight={hl} />
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
