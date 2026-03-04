import { useCases, useResult, useWiborSource } from '../../core/CaseContext';
import { tabModules } from '../../modules';
import LoanForm from '../../core-ui/LoanForm';
import { Panel } from '../../components/ui/Panel';
import { ToggleGroup } from '../../components/ui/ToggleGroup';
import { WIBOR_LAST_ACTUAL } from '../../data/wiborRates';

function WiborSourceBadge() {
  const { wiborData, openSheetModule } = useCases();
  const wiborSource = useWiborSource();
  const first = wiborData[0]?.date.slice(0, 7);
  const last = wiborData[wiborData.length - 1]?.date.slice(0, 7);
  const range = first && last ? `${first} \u2192 ${last}` : '';
  const isDefault = wiborSource !== 'custom';

  return (
    <button onClick={() => openSheetModule('wiborData')} className={`mt-3 rounded-lg px-4 py-2.5 text-xs text-left w-full cursor-pointer ${
      isDefault ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
    }`}>
      <div>Dane WIBOR: {isDefault ? 'wbudowane (przybliżone)' : 'zaimportowane'} · {wiborData.length} wpisów · {range}</div>
      {isDefault && (
        <div className="mt-1">Zawiera prognozy od {WIBOR_LAST_ACTUAL.replace('-', '/')}. <span className="underline font-medium">Zaimportuj dokładne dane</span></div>
      )}
    </button>
  );
}

export default function CalculatorView() {
  const { activeTab, setActiveTab, activeCaseId } = useCases();
  const result = useResult();

  const activeTabModule = tabModules.find(m => m.id === activeTab) ?? tabModules[0];
  const tabItems = tabModules.map(m => ({ id: m.id, label: m.label }));

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
            <div className="bg-white rounded-xl shadow p-1">
              <ToggleGroup items={tabItems} active={activeTabModule.id} onSelect={setActiveTab} variant="tabs" />
            </div>
            <activeTabModule.Component />
          </div>
        ) : (
          <Panel className="p-12 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Scenariusz: Odwiborowanie</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Symulacja usunięcia WIBOR z umowy kredytowej. Wypełnij formularz po lewej stronie, aby porównać raty z WIBOR i bez WIBOR (tylko marża banku).
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
}
