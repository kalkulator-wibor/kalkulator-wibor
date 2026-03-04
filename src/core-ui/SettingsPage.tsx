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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Ustawienia</h2>
        <p className="text-sm text-gray-500 mt-1">Konfiguracja modułów</p>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">Moduły</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {appModules.map(mod => {
          const Icon = mod.icon;
          const enabled = mod.alwaysEnabled || enabledAppModules.includes(mod.id);
          return (
            <button key={mod.id}
              onClick={() => !mod.comingSoon && toggleModule(mod.id, mod.alwaysEnabled)}
              className={`relative text-left p-5 rounded-xl border-2 transition-colors ${
                mod.comingSoon ? 'cursor-default opacity-50'
                  : mod.alwaysEnabled ? 'cursor-default'
                  : 'cursor-pointer'
              } ${
                mod.comingSoon ? 'border-gray-200 bg-gray-50'
                  : enabled ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${mod.comingSoon ? 'bg-gray-100 text-gray-300' : enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800">{mod.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{mod.description}</div>
                </div>
              </div>
              {mod.comingSoon && (
                <span className="absolute top-3 right-3 text-xs text-gray-400 font-medium">wkrótce</span>
              )}
              {!mod.comingSoon && mod.alwaysEnabled && (
                <span className="absolute top-3 right-3 text-xs text-gray-400 font-medium">zawsze wł.</span>
              )}
              {!mod.comingSoon && !mod.alwaysEnabled && (
                <span className={`absolute top-3 right-3 text-xs font-medium ${enabled ? 'text-blue-600' : 'text-gray-400'}`}>
                  {enabled ? 'włączony' : 'wyłączony'}
                </span>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
