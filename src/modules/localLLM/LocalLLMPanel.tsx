import { useState, useEffect, useRef } from 'react';
import { Bot, Download, Trash2, Send, Loader2, Database } from 'lucide-react';
import {
  subscribeLLM,
  loadModel,
  deleteModelCache,
  getCacheSize,
  isModelCached,
  streamChatCompletion,
  getLLMStatus,
  type LLMProgress,
  type WllamaChatMessage,
} from '../../core/llmService';
import { useCases, useCaseFiles } from '../../core/CaseContext';
import { getDocumentText } from '../../core/ocrPipeline';
import { indexDocument, searchChunks, isDocumentIndexed } from '../../core/embeddingService';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function ModelStatus() {
  const [progress, setProgress] = useState<LLMProgress>({ status: 'idle', downloaded: 0, total: 0 });
  const [cached, setCached] = useState<boolean | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => subscribeLLM(setProgress), []);

  useEffect(() => {
    isModelCached().then(setCached);
    getCacheSize().then(setCacheSize);
  }, [progress.status]);

  const handleLoad = async () => {
    try { await loadModel(); } catch {}
  };

  const handleDelete = async () => {
    if (!confirm('Usunąć model z pamięci przeglądarki?')) return;
    setDeleting(true);
    try {
      await deleteModelCache();
      setCached(false);
      setCacheSize(0);
    } finally {
      setDeleting(false);
    }
  };

  const isDownloading = progress.status === 'downloading';
  const isLoading = progress.status === 'loading';
  const isReady = progress.status === 'ready';
  const pct = progress.total > 0 ? (progress.downloaded / progress.total * 100).toFixed(0) : 0;

  return (
    <div className="bg-base-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">Bielik 1.5B v3 Instruct</h4>
          <p className="text-xs opacity-50">Polski LLM (Q4, ~928 MB) — działa lokalnie w przeglądarce</p>
        </div>
        <div className="flex items-center gap-2">
          {isReady && <span className="badge badge-success badge-sm">Gotowy</span>}
          {isDownloading && <span className="badge badge-info badge-sm">Pobieranie</span>}
          {isLoading && <span className="badge badge-warning badge-sm">Ładowanie</span>}
          {progress.status === 'error' && <span className="badge badge-error badge-sm">Błąd</span>}
          {progress.status === 'idle' && cached && <span className="badge badge-sm">W pamięci</span>}
        </div>
      </div>

      {isDownloading && (
        <div>
          <progress className="progress progress-info w-full h-2" value={progress.downloaded} max={progress.total} />
          <p className="text-[10px] opacity-50 mt-1">
            {formatBytes(progress.downloaded)} / {formatBytes(progress.total)} ({pct}%)
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-xs opacity-60">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Inicjalizacja modelu...
        </div>
      )}

      {progress.status === 'error' && (
        <p className="text-xs text-error">{progress.error}</p>
      )}

      <div className="flex gap-2">
        {!isReady && !isDownloading && !isLoading && (
          <button onClick={handleLoad} className="btn btn-primary btn-sm gap-1">
            <Download className="w-3.5 h-3.5" />
            {cached ? 'Załaduj model' : 'Pobierz i załaduj'}
          </button>
        )}
        {(cached || isReady) && !isDownloading && !isLoading && (
          <button onClick={handleDelete} disabled={deleting} className="btn btn-ghost btn-sm gap-1 text-error">
            <Trash2 className="w-3.5 h-3.5" />
            Usuń z pamięci
          </button>
        )}
      </div>

      {cacheSize > 0 && (
        <p className="text-[10px] opacity-40">Zajętość w OPFS: {formatBytes(cacheSize)}</p>
      )}
    </div>
  );
}

function IndexStatus() {
  const activeCaseId = useCases(s => s.activeCaseId);
  const caseFiles = useCaseFiles();
  const contractFile = caseFiles.find(f => f.evidenceKey === 'contract');

  const [indexed, setIndexed] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState('');
  const [indexProgress, setIndexProgress] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);

  useEffect(() => {
    if (activeCaseId) {
      isDocumentIndexed(activeCaseId, 'contract').then(setIndexed);
    }
  }, [activeCaseId, contractFile]);

  const handleIndex = async () => {
    console.log('[IndexStatus] handleIndex called, activeCaseId:', activeCaseId);
    if (!activeCaseId) {
      console.log('[IndexStatus] No activeCaseId — aborting');
      return;
    }
    const doc = await getDocumentText(activeCaseId, 'contract');
    console.log('[IndexStatus] getDocumentText result:', doc ? `${doc.pages.length} pages` : 'NULL');
    if (!doc) {
      setIndexStatus('Brak tekstu OCR — najpierw uruchom analizę PDF');
      return;
    }

    setIndexing(true);
    setIndexProgress(0);
    try {
      console.log('[IndexStatus] Starting indexDocument...');
      const count = await indexDocument(activeCaseId, 'contract', doc.pages, (p) => {
        console.log('[IndexStatus] progress:', p.status, p.progress);
        setIndexStatus(p.status);
        if (p.progress != null) setIndexProgress(p.progress);
      });
      setChunkCount(count);
      setIndexed(true);
      console.log('[IndexStatus] indexDocument returned:', count);
    } catch (err) {
      console.error('[IndexStatus] Index FAILED:', err);
      setIndexStatus(`Błąd: ${err instanceof Error ? err.message : 'nieznany'}`);
    } finally {
      setIndexing(false);
    }
  };

  if (!contractFile) {
    return (
      <div className="alert text-xs py-2">
        Wgraj umowę kredytu (PDF) i uruchom OCR w panelu Sprawy.
      </div>
    );
  }

  return (
    <div className="bg-base-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 opacity-50" />
          <span className="text-sm font-medium">Indeks RAG</span>
        </div>
        {indexed && <span className="badge badge-success badge-xs">Zindeksowano</span>}
      </div>

      {indexing && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs opacity-60">
            <Loader2 className="w-3 h-3 animate-spin" />
            {indexStatus}
          </div>
          {indexProgress > 0 && (
            <progress className="progress progress-primary w-full h-1.5" value={indexProgress} max={100} />
          )}
        </div>
      )}

      {!indexing && indexStatus && !indexed && (
        <p className="text-xs text-error">{indexStatus}</p>
      )}

      {indexed && chunkCount > 0 && (
        <p className="text-[10px] opacity-40">{chunkCount} chunków w bazie wektorów</p>
      )}

      {!indexed && !indexing && (
        <button onClick={handleIndex} className="btn btn-sm btn-outline gap-1">
          <Database className="w-3.5 h-3.5" />
          Zindeksuj umowę
        </button>
      )}

      {indexed && !indexing && (
        <button onClick={handleIndex} className="btn btn-xs btn-ghost opacity-50">
          Przeindeksuj
        </button>
      )}
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  context?: string;
}

function ChatSection() {
  const [progress, setProgress] = useState<LLMProgress>({ status: 'idle', downloaded: 0, total: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCaseId = useCases(s => s.activeCaseId);

  useEffect(() => subscribeLLM(setProgress), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamText]);

  const isReady = progress.status === 'ready';

  const handleSend = async () => {
    if (!input.trim() || generating || !isReady) return;
    const query = input.trim();
    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setGenerating(true);
    setStreamText('');

    let contextText = '';

    // RAG: search for relevant chunks
    if (activeCaseId) {
      try {
        setSearching(true);
        const chunks = await searchChunks(activeCaseId, 'contract', query, 3);
        if (chunks.length > 0) {
          contextText = chunks.map(c => c.text).join('\n\n');
          console.log(`[RAG] Found ${chunks.length} chunks, ${contextText.length} chars`);
        }
      } catch (err) {
        console.log('[RAG] Search skipped:', err);
      } finally {
        setSearching(false);
      }
    }

    const systemPrompt = contextText
      ? `Ekspert prawa bankowego PL. Oto fragmenty umowy kredytu:\n\n${contextText}\n\nOdpowiadaj po polsku, zwięźle, na podstawie powyższych fragmentów.`
      : 'Ekspert prawa bankowego PL. Odpowiadaj po polsku, 1-2 zdania.';

    const chatHistory: WllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    try {
      const result = await streamChatCompletion(chatHistory, setStreamText);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result,
        context: contextText || undefined,
      }]);
      setStreamText('');
    } catch (err) {
      console.error('[LLM] Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Błąd generowania odpowiedzi.' }]);
      setStreamText('');
    } finally {
      setGenerating(false);
    }
  };

  if (!isReady) {
    return (
      <div className="text-center py-8 space-y-2">
        <Bot className="w-10 h-10 mx-auto opacity-20" />
        <p className="text-sm opacity-50">Załaduj model, aby rozpocząć czat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={scrollRef} className="space-y-3 max-h-96 overflow-y-auto p-1">
        {messages.length === 0 && !generating && (
          <p className="text-xs opacity-40 text-center py-4">
            Zapytaj o umowę kredytu — np. "Jaka jest marża?" lub "Co mówi o WIBOR?"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat ${m.role === 'user' ? 'chat-end' : 'chat-start'}`}>
            <div className={`chat-bubble text-sm ${m.role === 'user' ? 'chat-bubble-primary' : ''}`}>
              {m.content}
            </div>
            {m.context && (
              <div className="chat-footer opacity-40 text-[10px] mt-0.5">
                RAG: {m.context.length} znaków kontekstu
              </div>
            )}
          </div>
        ))}
        {generating && searching && (
          <div className="chat chat-start">
            <div className="chat-bubble text-sm">
              <Loader2 className="w-4 h-4 animate-spin inline" /> Szukam w umowie...
            </div>
          </div>
        )}
        {generating && !searching && streamText && (
          <div className="chat chat-start">
            <div className="chat-bubble text-sm">{streamText}<span className="animate-pulse">▌</span></div>
          </div>
        )}
        {generating && !searching && !streamText && (
          <div className="chat chat-start">
            <div className="chat-bubble text-sm">
              <Loader2 className="w-4 h-4 animate-spin inline" /> Myślę...
            </div>
          </div>
        )}
      </div>

      <div className="join w-full">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Zapytaj o umowę..."
          className="input input-bordered join-item flex-1"
          disabled={generating}
        />
        <button onClick={handleSend} disabled={generating || !input.trim()} className="btn btn-primary join-item">
          <Send className="w-4 h-4" />
        </button>
      </div>

      {messages.length > 0 && !generating && (
        <button onClick={() => setMessages([])} className="btn btn-ghost btn-xs opacity-50">
          Wyczyść czat
        </button>
      )}
    </div>
  );
}

export default function LocalLLMPanel() {
  return (
    <div className="space-y-4">
      <ModelStatus />
      <IndexStatus />
      <ChatSection />
    </div>
  );
}
