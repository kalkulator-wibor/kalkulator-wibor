import { Search, FileText, ArrowRight } from 'lucide-react';
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
      className="mt-4 w-full text-left cursor-pointer group">
      <div className="px-3 py-3 bg-warning/10 rounded-lg">
        <div className="flex items-baseline justify-between">
          <p className="label-caps !opacity-40 group-hover:!opacity-60 transition-opacity">Dane WIBOR</p>
          <p className="text-[0.6875rem] opacity-40 group-hover:opacity-60 transition-opacity tabular-nums">{wiborData.length} wpisów · {range}</p>
        </div>
        {isDefault && (
          <p className="text-[0.75rem] opacity-40 mt-1.5">
            Wbudowane (przybliżone) · prognozy od {WIBOR_LAST_ACTUAL.replace('-', '/')} · <span className="underline group-hover:opacity-80">importuj dokładne</span>
          </p>
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
          <div className="flex flex-col">
            {/* Hero — dominant element, golden ratio spacing */}
            <div className="pt-8 pb-10 px-2">
              <h2 className="display-tight leading-[1.1]">
                Klauzule WIBOR<br />w&nbsp;Twoim kredycie
              </h2>
              <div className="mt-6 flex flex-col gap-3 text-[0.9375rem] opacity-70 leading-relaxed">
                <p className="flex items-center gap-3"><Search className="w-4 h-4 opacity-40 shrink-0" />System analizy klauzul WIBOR w&nbsp;umowach kredytowych</p>
                <p className="flex items-center gap-3"><FileText className="w-4 h-4 opacity-40 shrink-0" />Przygotowanie dokumentacji procesowej</p>
                <p className="flex items-center gap-3"><ArrowRight className="w-4 h-4 opacity-40 shrink-0" />Prowadzenie sprawy od wezwania przedsądowego do&nbsp;wyroku</p>
              </div>
              <p className="label-caps mt-10">Wypełnij formularz aby rozpocząć</p>
            </div>

            {/* Divider — thin, Swiss-style */}
            <div className="border-t border-base-300 mx-2" />

            {/* TSUE — secondary block, restrained */}
            <div className="py-8 px-2">
              <p className="label-caps mb-3">Wyrok TSUE</p>
              <h3 className="leading-snug">
                C-471/24 z&nbsp;12.02.2026 — klauzule WIBOR podlegają kontroli abuzywności
              </h3>
              <p className="mt-3 text-[0.8125rem] opacity-55 leading-relaxed max-w-lg">
                TSUE potwierdził, że klauzule zmiennego oprocentowania z&nbsp;WIBOR mogą być badane pod kątem nieuczciwości (dyrektywa 93/13). Kluczowe jest, czy bank prawidłowo poinformował konsumenta o&nbsp;ryzyku zmiennej stopy — w&nbsp;tym czy dostarczył formularz ESIS z&nbsp;symulacją skrajnego wzrostu rat (dyrektywa 2014/17, umowy od&nbsp;2016&nbsp;r.).
              </p>
              <p className="mt-2 text-[0.75rem] opacity-40 leading-relaxed max-w-lg">
                Każda umowa wymaga indywidualnej analizy. Sam wskaźnik WIBOR nie został zakwestionowany — ocenie podlega sposób jego zastosowania w&nbsp;umowie i&nbsp;realizacja obowiązków informacyjnych.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-base-300 mx-2" />

            {/* Modules — compact grid, Fibonacci scale */}
            <div className="py-8 px-2">
              <p className="label-caps mb-5">Moduły systemu</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-2xl font-bold tracking-tight">AI Bielik</p>
                  <p className="text-[0.8125rem] opacity-50 mt-1">analiza umowy, predykcja szans, redakcja pism</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">Automat</p>
                  <p className="text-[0.8125rem] opacity-50 mt-1">prowadzenie sprawy od wezwania do&nbsp;wyroku</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">Pozew</p>
                  <p className="text-[0.8125rem] opacity-50 mt-1">dane stron, WPS, opłata sądowa, dowody</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">Kalkulator</p>
                  <p className="text-[0.8125rem] opacity-50 mt-1">nadpłacone odsetki, harmonogram, porównanie</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
