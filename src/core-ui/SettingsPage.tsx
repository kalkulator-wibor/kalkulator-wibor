import { useCases } from '../core/CaseContext';
import { appModules } from '../modules';

export default function SettingsPage() {
  const { enabledAppModules, setEnabledAppModules } = useCases();

  const toggleModule = (id: string, alwaysEnabled?: boolean) => {
    if (alwaysEnabled) return;
    setEnabledAppModules(
      enabledAppModules.includes(id)
        ? enabledAppModules.filter(m => m !== id)
        : [...enabledAppModules, id]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-1">Ustawienia</h2>
      <p className="text-sm opacity-50 mb-6">Konfiguracja modułów</p>

      <h3 className="text-lg font-bold mb-4">Moduły</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {appModules.map(mod => {
          const Icon = mod.icon;
          const enabled = mod.alwaysEnabled || enabledAppModules.includes(mod.id);
          return (
            <button key={mod.id}
              onClick={() => !mod.comingSoon && toggleModule(mod.id, mod.alwaysEnabled)}
              className={`card card-border text-left p-5 transition-colors ${
                mod.comingSoon ? 'cursor-default opacity-50'
                  : mod.alwaysEnabled ? 'cursor-default'
                  : 'cursor-pointer hover:bg-base-200'
              } ${enabled && !mod.comingSoon ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${mod.comingSoon ? 'bg-base-200 opacity-30' : enabled ? 'bg-primary/10 text-primary' : 'bg-base-200 opacity-40'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{mod.label}</div>
                  <div className="text-sm opacity-60 mt-0.5">{mod.description}</div>
                </div>
                <span className="text-xs opacity-40 font-medium">
                  {mod.comingSoon ? 'wkrótce' : mod.alwaysEnabled ? 'zawsze wł.' : enabled ? 'włączony' : 'wyłączony'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
