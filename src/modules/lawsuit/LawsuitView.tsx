import { Settings, FolderOpen, CheckCircle, Circle } from 'lucide-react';
import { useCases, useActiveCase, useResult, useCaseFiles, useTemplates, getBank } from '../../core/CaseContext';
import { EVIDENCE_ITEMS } from '../../core/types';
import { formatPLN } from '../../utils/formatters';

function CaseOverview() {
  const activeCase = useActiveCase()!;
  const result = useResult();
  const caseFiles = useCaseFiles();
  const templates = useTemplates();
  const tpl = activeCase.templateId ? templates.find(t => t.id === activeCase.templateId) : null;
  const bank = tpl ? getBank(tpl.bankId) : null;
  const { lawsuit } = activeCase;

  const evidenceEntries = Object.entries(EVIDENCE_ITEMS);
  const uploadedCount = evidenceEntries.filter(([key]) => caseFiles.some(f => f.evidenceKey === key)).length;

  const hasPlaintiff = !!(lawsuit.plaintiff.name && lawsuit.plaintiff.pesel);
  const hasBank = !!bank;
  const hasCourt = !!lawsuit.courtName;
  const hasResult = !!result;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">{activeCase.name}</h2>
        {tpl && <p className="text-sm opacity-50 mt-1">{tpl.label}</p>}
      </div>

      {/* Gotowość */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="font-bold text-sm opacity-60 uppercase tracking-wider mb-3">Stan sprawy</h3>
          <div className="space-y-2">
            <StatusRow done={hasResult} label="Obliczenia" detail={hasResult ? `Różnica: ${formatPLN(result!.overpaidInterest)}` : 'Wypełnij formularz i oblicz'} />
            <StatusRow done={hasBank} label="Bank (strona)" detail={hasBank ? bank!.name : 'Wybierz szablon umowy'} />
            <StatusRow done={hasPlaintiff} label="Dane powoda" detail={hasPlaintiff ? lawsuit.plaintiff.name : 'Uzupełnij w panelu Sprawy'} />
            <StatusRow done={hasCourt} label="Sąd właściwy" detail={hasCourt ? lawsuit.courtName : 'Uzupełnij w panelu Sprawy'} />
            <StatusRow done={uploadedCount === evidenceEntries.length} label="Dokumenty" detail={`${uploadedCount} z ${evidenceEntries.length} załączonych`} />
          </div>
        </div>
      </div>

      {/* Dokumenty */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="font-bold text-sm opacity-60 uppercase tracking-wider mb-3">Dokumenty</h3>
          <div className="space-y-1.5">
            {evidenceEntries.map(([key, label]) => {
              const file = caseFiles.find(f => f.evidenceKey === key);
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {file
                    ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    : <Circle className="w-4 h-4 opacity-20 shrink-0" />}
                  <span className={file ? '' : 'opacity-40'}>{label}</span>
                  {file && <span className="text-xs opacity-30 ml-auto">{file.fileName}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2">
      {done
        ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
        : <Circle className="w-4 h-4 opacity-20 shrink-0" />}
      <span className="text-sm font-medium w-32">{label}</span>
      <span className={`text-sm ${done ? 'opacity-60' : 'opacity-40 italic'}`}>{detail}</span>
    </div>
  );
}

export default function LawsuitView() {
  const { enabledAppModules, setActiveTab, cases, openSheetModule } = useCases();
  const activeCase = useActiveCase();
  const casesEnabled = enabledAppModules.includes('cases');

  if (!casesEnabled) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
        <div className="card-body items-center text-center py-12">
          <Settings className="w-10 h-10 opacity-30 mb-2" />
          <h2 className="card-title">Moduł Sprawy jest wyłączony</h2>
          <p className="opacity-60 max-w-md">
            Aby korzystać z&nbsp;analizy, włącz moduł Sprawy w&nbsp;ustawieniach.
          </p>
          <button onClick={() => setActiveTab('settings')} className="btn btn-outline btn-sm mt-4">
            Otwórz ustawienia
          </button>
        </div>
      </div>
    );
  }

  if (cases.length === 0 || !activeCase) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
        <div className="card-body items-center text-center py-12">
          <FolderOpen className="w-10 h-10 opacity-30 mb-2" />
          <h2 className="card-title">Brak sprawy</h2>
          <p className="opacity-60 max-w-md">
            Wypełnij formularz, oblicz wyniki i&nbsp;zapisz jako sprawę.
          </p>
          <button onClick={() => openSheetModule('cases')} className="btn btn-outline btn-sm mt-4">
            Otwórz panel spraw
          </button>
        </div>
      </div>
    );
  }

  return <CaseOverview />;
}
