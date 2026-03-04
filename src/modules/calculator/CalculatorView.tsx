import { useCases, useResult, useWiborSource } from '../../core/CaseContext';
import { tabModules } from '../../modules';
import LoanForm from '../../core-ui/LoanForm';
import { WIBOR_LAST_ACTUAL } from '../../data/wiborRates';

function WiborSourceBadge() {
  const { wiborData, openSheetModule } = useCases();
  const wiborSource = useWiborSource();
  const first = wiborData[0]?.date.slice(0, 7);
  const last = wiborData[wiborData.length - 1]?.date.slice(0, 7);
  const range = first && last ? `${first} \u2192 ${last}` : '';
  const isDefault = wiborSource !== 'custom';

  return (
    <button onClick={() => openSheetModule('wiborData')}
      className={`mt-3 w-full text-left cursor-pointer alert text-xs ${isDefault ? 'alert-warning' : 'alert-success'}`}>
      <div>
        <div>Dane WIBOR: {isDefault ? 'wbudowane (przybliżone)' : 'zaimportowane'} · {wiborData.length} wpisów · {range}</div>
        {isDefault && (
          <div className="mt-1">Zawiera prognozy od {WIBOR_LAST_ACTUAL.replace('-', '/')}. <span className="underline font-medium">Zaimportuj dokładne dane</span></div>
        )}
      </div>
    </button>
  );
}

export default function CalculatorView() {
  const { activeTab, setActiveTab, activeCaseId } = useCases();
  const result = useResult();

  const activeTabModule = tabModules.find(m => m.id === activeTab) ?? tabModules[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-6">
          <LoanForm key={activeCaseId} />
          <WiborSourceBadge />
        </div>
      </div>

      <div className="lg:col-span-8">
        {result ? (
          <div className="space-y-6">
            <div role="tablist" className="tabs tabs-boxed">
              {tabModules.map(m => (
                <button key={m.id} role="tab" onClick={() => setActiveTab(m.id)}
                  className={`tab ${activeTabModule.id === m.id ? 'tab-active' : ''}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <activeTabModule.Component />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body py-8">
                <h2 className="text-2xl font-bold">Oblicz ile przepłacasz na kredycie z WIBOR</h2>
                <ul className="mt-4 space-y-3 text-base">
                  <li className="flex gap-3 items-start"><span className="text-success text-lg">✓</span> Porównaj ratę z WIBOR i bez WIBOR</li>
                  <li className="flex gap-3 items-start"><span className="text-success text-lg">✓</span> Oblicz kwotę roszczenia do pozwu bankowego</li>
                  <li className="flex gap-3 items-start"><span className="text-success text-lg">✓</span> Zobacz ile nadpłaciłeś od początku kredytu</li>
                </ul>
                <p className="mt-4 text-sm opacity-60">Wypełnij formularz aby zobaczyć wynik</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body py-6">
                <h3 className="font-bold text-lg">Wyrok TSUE C-471/24 z 12.02.2026</h3>
                <p className="text-sm opacity-80 mt-1">Trybunał potwierdził — klauzule WIBOR + marża mogą być badane pod kątem nieuczciwości. Banki miały obowiązek przedstawić symulację skrajnego wzrostu stóp. Większość tego nie zrobiła.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="badge badge-outline">odwiborowanie</span>
                  <span className="badge badge-outline">pozew o WIBOR</span>
                  <span className="badge badge-outline">abuzywność klauzuli</span>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body py-6">
                <h3 className="font-bold text-lg">Co możesz zyskać?</h3>
                <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                  <div className="flex gap-2 items-start"><span className="text-primary font-bold">↓</span> Rata niższa nawet o 30–50%</div>
                  <div className="flex gap-2 items-start"><span className="text-primary font-bold">↻</span> Zwrot nadpłaconych odsetek</div>
                  <div className="flex gap-2 items-start"><span className="text-primary font-bold">↓</span> Niższe saldo zadłużenia</div>
                  <div className="flex gap-2 items-start"><span className="text-primary font-bold">✓</span> Przewidywalna rata na przyszłość</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
