import { Wllama, type ChatCompletionOptions, type WllamaChatMessage, LoggerWithoutDebug } from '@wllama/wllama';

const WasmFromCDN = {
  'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/src/single-thread/wllama.wasm',
  'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/src/multi-thread/wllama.wasm',
};

// Bielik 1.5B v3 Instruct — polski LLM od SpeakLeash.
// Q4_K_M (~928MB) skwantyzowany z FP16 za pomocą llama-quantize.
// TODO: wrzucić Q4_K_M na HuggingFace organizacji projektu i zmienić URL.
function getModelUrl(): string {
  return `${window.location.origin}/models/Bielik-1.5B-v3.0-Instruct.Q4_K_M.gguf`;
}

export type LLMStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

export interface LLMProgress {
  status: LLMStatus;
  downloaded: number;
  total: number;
  error?: string;
}

let wllama: Wllama | null = null;
let currentStatus: LLMStatus = 'idle';
let listeners: Set<(p: LLMProgress) => void> = new Set();
let lastProgress: LLMProgress = { status: 'idle', downloaded: 0, total: 0 };

function notify(p: Partial<LLMProgress>) {
  lastProgress = { ...lastProgress, ...p };
  currentStatus = lastProgress.status;
  listeners.forEach(fn => fn(lastProgress));
}

export function subscribeLLM(fn: (p: LLMProgress) => void): () => void {
  listeners.add(fn);
  fn(lastProgress);
  return () => listeners.delete(fn);
}

export function getLLMStatus(): LLMStatus {
  return currentStatus;
}

export async function isModelCached(): Promise<boolean> {
  try {
    const w = getOrCreateWllama();
    const models = await w.modelManager.getModels();
    return models.some(m => m.url.includes('Bielik') && m.validate() === 'valid');
  } catch {
    return false;
  }
}

function getOrCreateWllama(): Wllama {
  if (!wllama) {
    wllama = new Wllama(WasmFromCDN, {
      logger: LoggerWithoutDebug,
      allowOffline: true,
    });
  }
  return wllama;
}

export async function loadModel(): Promise<void> {
  if (currentStatus === 'ready' || currentStatus === 'downloading' || currentStatus === 'loading') return;

  const w = getOrCreateWllama();

  try {
    notify({ status: 'downloading', downloaded: 0, total: 0, error: undefined });

    await w.loadModelFromUrl(getModelUrl(), {
      n_ctx: 2048,
      n_batch: 256,
      progressCallback: ({ loaded, total }) => {
        notify({ status: 'downloading', downloaded: loaded, total });
      },
    });

    notify({ status: 'loading' });

    // Model loaded successfully
    notify({ status: 'ready' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[LLM] Load failed:', msg);
    notify({ status: 'error', error: msg });
    throw err;
  }
}

export async function unloadModel(): Promise<void> {
  if (wllama) {
    await wllama.exit();
    wllama = null;
  }
  notify({ status: 'idle', downloaded: 0, total: 0 });
}

export async function deleteModelCache(): Promise<void> {
  await unloadModel();
  const w = getOrCreateWllama();
  await w.cacheManager.clear();
  wllama = null;
}

export async function getCacheSize(): Promise<number> {
  try {
    const w = getOrCreateWllama();
    const entries = await w.cacheManager.list();
    return entries.reduce((sum, e) => sum + e.size, 0);
  } catch {
    return 0;
  }
}

export async function chatCompletion(
  messages: WllamaChatMessage[],
  options?: Partial<ChatCompletionOptions>,
): Promise<string> {
  if (currentStatus !== 'ready' || !wllama) {
    throw new Error('Model not loaded');
  }
  return wllama.createChatCompletion(messages, {
    nPredict: 256,
    sampling: { temp: 0.3, top_p: 0.9, top_k: 40 },
    useCache: true,
    ...options,
  });
}

export async function streamChatCompletion(
  messages: WllamaChatMessage[],
  onToken: (text: string) => void,
  options?: Partial<ChatCompletionOptions>,
): Promise<string> {
  if (currentStatus !== 'ready' || !wllama) {
    throw new Error('Model not loaded');
  }

  const t0 = performance.now();
  let firstTokenTime: number | null = null;
  let tokenCount = 0;

  const mem0 = (performance as any).memory?.usedJSHeapSize;
  console.log('[LLM] ===== CHAT START =====');
  console.log('[LLM] Multi-thread:', wllama.isMultithread(), '| Threads:', wllama.getNumThreads());
  console.log(`[LLM] Memory: ${mem0 ? (mem0 / 1024 / 1024).toFixed(0) + ' MB' : 'N/A'}`);
  for (const m of messages) {
    console.log(`[LLM] ${m.role.toUpperCase()}: ${m.content.slice(0, 300)}${m.content.length > 300 ? '...' : ''}`);
  }

  const result = await wllama.createChatCompletion(messages, {
    nPredict: 256,
    sampling: { temp: 0.3, top_p: 0.9, top_k: 40 },
    useCache: true,
    ...options,
    onNewToken: (_token, _piece, currentText) => {
      tokenCount++;
      if (!firstTokenTime) {
        firstTokenTime = performance.now();
        console.log(`[LLM] First token after ${((firstTokenTime - t0) / 1000).toFixed(1)}s (prompt eval)`);
      }
      onToken(currentText);
    },
  });

  const totalTime = (performance.now() - t0) / 1000;
  const genTime = firstTokenTime ? (performance.now() - firstTokenTime) / 1000 : 0;
  const tokPerSec = genTime > 0 ? (tokenCount / genTime).toFixed(1) : '?';
  const mem1 = (performance as any).memory?.usedJSHeapSize;
  console.log('[LLM] ===== CHAT DONE =====');
  console.log(`[LLM] Tokens: ${tokenCount} | Total: ${totalTime.toFixed(1)}s | Gen: ${genTime.toFixed(1)}s | Speed: ${tokPerSec} tok/s`);
  console.log(`[LLM] Memory: ${mem1 ? (mem1 / 1024 / 1024).toFixed(0) + ' MB' : 'N/A'} (delta: ${mem0 && mem1 ? ((mem1 - mem0) / 1024 / 1024).toFixed(0) + ' MB' : 'N/A'})`);
  console.log(`[LLM] ANSWER: ${result}`);

  return result;
}

export { type WllamaChatMessage };
