import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useCases } from '../../core/CaseContext';
import { formatPLN } from '../../utils/formatters';

export default function CasesPanel() {
  const { cases, activeCaseId, loadCase, createCase, deleteCase, renameCase, closeSheet } = useCases();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCase(newName.trim());
    setNewName('');
    closeSheet();
  };

  const handleOpen = async (id: string) => { await loadCase(id); closeSheet(); };
  const handleRename = async (id: string) => { if (!editName.trim()) return; await renameCase(id, editName.trim()); setEditingId(null); };
  const handleDelete = async (id: string, name: string) => { if (!confirm(`Usunąć sprawę "${name}"?`)) return; await deleteCase(id); };

  return (
    <div className="space-y-4">
      <div className="bg-base-200 rounded-lg p-4">
        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3">Nowa sprawa</h4>
        <div className="join w-full">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nazwa sprawy (np. Kowalski - Santander 2015)"
            className="input input-bordered join-item flex-1" />
          <button onClick={handleCreate} disabled={!newName.trim()} className="btn btn-primary join-item">Utwórz</button>
        </div>
      </div>

      {cases.length === 0 ? (
        <p className="py-8 text-center opacity-50 text-sm">Brak spraw. Utwórz pierwszą sprawę powyżej.</p>
      ) : (
        <div className="space-y-2">
          {cases.map(c => (
            <div key={c.id} className={`card card-border p-3 ${c.id === activeCaseId ? 'border-primary bg-primary/5' : ''}`}>
              {editingId === c.id ? (
                <div className="flex gap-2 items-center">
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(c.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="input input-bordered input-sm flex-1" autoFocus />
                  <button onClick={() => handleRename(c.id)} className="btn btn-sm btn-primary">Zapisz</button>
                  <button onClick={() => setEditingId(null)} className="btn btn-sm btn-ghost">Anuluj</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button onClick={() => handleOpen(c.id)} className="flex-1 text-left cursor-pointer min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs opacity-50 mt-0.5">{formatPLN(c.input.loanAmount)} | marża {c.input.margin}% | {c.input.loanPeriodMonths} mies.</div>
                  </button>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} className="btn btn-ghost btn-xs btn-circle" title="Zmień nazwę"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="btn btn-ghost btn-xs btn-circle hover:text-error" title="Usuń"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
