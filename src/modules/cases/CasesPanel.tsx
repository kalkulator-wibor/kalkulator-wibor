import { useState } from 'react';
import { useCases } from '../../core/CaseContext';
import { formatPLN } from '../../utils/formatters';
import { EditIcon, TrashIcon } from '../../components/ui/Icons';

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

  const handleOpen = async (id: string) => {
    await loadCase(id);
    closeSheet();
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await renameCase(id, editName.trim());
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Usunąć sprawę "${name}"?`)) return;
    await deleteCase(id);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Nowa sprawa</h4>
        <div className="flex gap-2">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nazwa sprawy (np. Kowalski - Santander 2015)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <button onClick={handleCreate} disabled={!newName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium cursor-pointer disabled:cursor-not-allowed">
            Utwórz
          </button>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">
          Brak spraw. Utwórz pierwszą sprawę powyżej.
        </div>
      ) : (
        <div className="space-y-2">
          {cases.map(c => (
            <div key={c.id} className={`rounded-lg border p-3 ${
              c.id === activeCaseId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            }`}>
              {editingId === c.id ? (
                <div className="flex gap-2 items-center">
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(c.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 px-2 py-1 border rounded text-sm text-gray-900" autoFocus />
                  <button onClick={() => handleRename(c.id)} className="text-sm text-blue-600 font-medium cursor-pointer">Zapisz</button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 cursor-pointer">Anuluj</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button onClick={() => handleOpen(c.id)} className="flex-1 text-left cursor-pointer min-w-0">
                    <div className="font-medium text-gray-800 truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatPLN(c.input.loanAmount)} | marża {c.input.margin}% | {c.input.loanPeriodMonths} mies.
                    </div>
                  </button>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Zmień nazwę">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer" title="Usuń">
                      <TrashIcon className="w-4 h-4" />
                    </button>
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
