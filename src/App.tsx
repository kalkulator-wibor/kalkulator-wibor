import { useEffect } from 'react';
import { useCases } from './core/CaseContext';
import { appModules } from './modules';
import SettingsPage from './core-ui/SettingsPage';
import { Sheet } from './components/ui/Sheet';
import { GearIcon } from './components/ui/Icons';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function SheetModuleRenderer() {
  const openSheet = useCases(s => s.openSheet);
  const closeSheet = useCases(s => s.closeSheet);
  const enabledAppModules = useCases(s => s.enabledAppModules);
  const mod = appModules.find(m => m.id === openSheet && m.type === 'sheet' && !m.comingSoon && (m.alwaysEnabled || enabledAppModules.includes(m.id)));
  if (!mod) return null;
  return <Sheet open onClose={closeSheet} title={mod.label}><ErrorBoundary><mod.Component /></ErrorBoundary></Sheet>;
}

function AppShell() {
  const activeTab = useCases(s => s.activeTab);
  const ready = useCases(s => s.ready);

  if (!ready) return null;

  if (activeTab === 'settings') return <SettingsPage />;

  // Default: render calculator (the only page module)
  const pageModule = appModules.find(m => m.type === 'page' && m.id === 'calculator');
  return pageModule ? <pageModule.Component /> : null;
}

function HeaderIconBar() {
  const activeTab = useCases(s => s.activeTab);
  const setActiveTab = useCases(s => s.setActiveTab);
  const enabledAppModules = useCases(s => s.enabledAppModules);
  const openSheet = useCases(s => s.openSheet);
  const openSheetModule = useCases(s => s.openSheetModule);
  const closeSheet = useCases(s => s.closeSheet);

  const visibleModules = appModules.filter(m => !m.comingSoon && (enabledAppModules.includes(m.id) || m.alwaysEnabled) && m.showInHeader !== false);
  const isOnCalculator = activeTab !== 'settings';

  return (
    <div className="flex items-center gap-1">
      {visibleModules.map(mod => {
        const Icon = mod.icon;
        const isActive = mod.type === 'page' ? isOnCalculator && mod.id === 'calculator'
          : openSheet === mod.id;

        const handleClick = () => {
          if (mod.type === 'page') {
            setActiveTab('summary');
          } else {
            openSheet === mod.id ? closeSheet() : openSheetModule(mod.id);
          }
        };

        return (
          <button key={mod.id} onClick={handleClick} title={mod.label}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isActive ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}>
            <Icon className="w-5 h-5" />
          </button>
        );
      })}

      <button onClick={() => setActiveTab('settings')} title="Ustawienia"
        className={`p-2 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'settings' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}>
        <GearIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function App() {
  const init = useCases(s => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kalkulator WIBOR</h1>
            <p className="text-gray-400 text-sm mt-1">Sprawdź ile przepłacasz na kredycie z WIBOR i ile możesz odzyskać</p>
          </div>
          <HeaderIconBar />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </main>

      <footer className="bg-gray-900 text-gray-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs">
          <p>Kalkulator ma charakter szacunkowy/poglądowy. Wyniki mogą się różnić od rzeczywistych kwot ze względu na zaokrąglenia, dokładne daty fixingów WIBOR i indywidualne warunki umowy.</p>
        </div>
      </footer>

      <SheetModuleRenderer />
    </div>
  );
}
