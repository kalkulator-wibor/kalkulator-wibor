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
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <h2 className="card-title">Scenariusz: Odwiborowanie</h2>
              <p className="opacity-60 max-w-md">
                Symulacja usunięcia WIBOR z umowy kredytowej. Wypełnij formularz po lewej stronie, aby porównać raty z WIBOR i bez WIBOR (tylko marża banku).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
