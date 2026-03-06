import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

const MODEL_NAME = 'Xenova/multilingual-e5-small';

let embedder: FeatureExtractionPipeline | null = null;

export type WorkerMessage =
  | { type: 'load' }
  | { type: 'embed'; id: number; text: string; prefix?: string }
  | { type: 'dispose' };

export type WorkerResponse =
  | { type: 'load-progress'; status: string; progress?: number }
  | { type: 'load-done' }
  | { type: 'load-error'; error: string }
  | { type: 'embed-done'; id: number; vector: number[] }
  | { type: 'embed-error'; id: number; error: string }
  | { type: 'disposed' };

async function loadModel() {
  postMessage({ type: 'load-progress', status: 'Pobieranie modelu embedding multilingual (~130 MB)...', progress: 0 } satisfies WorkerResponse);
  console.log('[EmbedWorker] Loading model...');
  embedder = await pipeline('feature-extraction', MODEL_NAME, {
    dtype: 'q8',
    progress_callback: (p: any) => {
      if (p.progress != null) {
        postMessage({ type: 'load-progress', status: `Pobieranie modelu... ${p.progress.toFixed(0)}%`, progress: p.progress } satisfies WorkerResponse);
      }
    },
  });
  console.log('[EmbedWorker] Model loaded');
  postMessage({ type: 'load-done' } satisfies WorkerResponse);
}

async function embed(id: number, text: string, prefix?: string) {
  if (!embedder) {
    postMessage({ type: 'embed-error', id, error: 'Model not loaded' } satisfies WorkerResponse);
    return;
  }
  try {
    const input = prefix ? `${prefix}: ${text}` : text;
    const result = await embedder(input, { pooling: 'mean', normalize: true });
    const vector = Array.from(result.data as Float32Array);
    if (typeof (result as any).dispose === 'function') {
      (result as any).dispose();
    }
    postMessage({ type: 'embed-done', id, vector } satisfies WorkerResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EmbedWorker] Embed failed for chunk ${id}:`, msg);
    postMessage({ type: 'embed-error', id, error: msg } satisfies WorkerResponse);
  }
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'load':
      try {
        await loadModel();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[EmbedWorker] Load failed:', errMsg);
        postMessage({ type: 'load-error', error: errMsg } satisfies WorkerResponse);
      }
      break;
    case 'embed':
      await embed(msg.id, msg.text, msg.prefix);
      break;
    case 'dispose':
      embedder = null;
      postMessage({ type: 'disposed' } satisfies WorkerResponse);
      break;
  }
};
