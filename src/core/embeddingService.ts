import { db } from './db';
import type { DocumentChunk } from './types';
import type { WorkerMessage, WorkerResponse } from './embeddingWorker';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 80;

let worker: Worker | null = null;
let workerReady = false;
let workerLoading = false;

export type EmbeddingProgress = {
  status: string;
  progress?: number;
  step?: 'model' | 'indexing' | 'done';
};

type ProgressCallback = (p: EmbeddingProgress) => void;

function getWorker(): Worker {
  if (!worker) {
    console.log('[Embedding] Creating Web Worker...');
    worker = new Worker(new URL('./embeddingWorker.ts', import.meta.url), { type: 'module' });
    worker.onerror = (e) => console.error('[Embedding] Worker ERROR:', e.message, e);
    console.log('[Embedding] Worker created');
  }
  return worker;
}

function postToWorker(msg: WorkerMessage) {
  getWorker().postMessage(msg);
}

async function ensureWorkerReady(onProgress?: ProgressCallback): Promise<void> {
  if (workerReady) return;
  if (workerLoading) {
    while (workerLoading) await new Promise(r => setTimeout(r, 100));
    if (workerReady) return;
    throw new Error('Worker failed to load model');
  }

  workerLoading = true;
  console.log('[Embedding] ensureWorkerReady: loading model via worker...');
  const w = getWorker();

  return new Promise<void>((resolve, reject) => {
    const handler = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      console.log('[Embedding] Worker message:', msg.type, 'type' in msg && 'status' in msg ? (msg as any).status : '');
      if (msg.type === 'load-progress') {
        onProgress?.({ status: msg.status, step: 'model', progress: msg.progress });
      } else if (msg.type === 'load-done') {
        w.removeEventListener('message', handler);
        workerReady = true;
        workerLoading = false;
        onProgress?.({ status: 'Model embedding gotowy', step: 'model', progress: 100 });
        resolve();
      } else if (msg.type === 'load-error') {
        w.removeEventListener('message', handler);
        workerLoading = false;
        reject(new Error(msg.error));
      }
    };
    w.addEventListener('message', handler);
    postToWorker({ type: 'load' });
  });
}

async function embedViaWorker(id: number, text: string, prefix?: string): Promise<number[]> {
  const w = getWorker();
  return new Promise<number[]>((resolve, reject) => {
    const handler = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'embed-done' && msg.id === id) {
        w.removeEventListener('message', handler);
        resolve(msg.vector);
      } else if (msg.type === 'embed-error' && msg.id === id) {
        w.removeEventListener('message', handler);
        reject(new Error(msg.error));
      }
    };
    w.addEventListener('message', handler);
    postToWorker({ type: 'embed', id, text, prefix });
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function splitIntoChunks(text: string, pageNum?: number): { text: string; pageNum?: number }[] {
  const chunks: { text: string; pageNum?: number }[] = [];
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

  // Merge small paragraphs together so we don't get tiny header-only chunks
  let buffer = '';
  for (const para of paragraphs) {
    if (buffer.length + para.length + 1 <= CHUNK_SIZE) {
      buffer = buffer ? buffer + '\n' + para : para;
    } else {
      if (buffer) chunks.push({ text: buffer, pageNum });
      if (para.length <= CHUNK_SIZE) {
        buffer = para;
      } else {
        // Split long paragraph with overlap
        let start = 0;
        while (start < para.length) {
          const end = Math.min(start + CHUNK_SIZE, para.length);
          chunks.push({ text: para.slice(start, end).trim(), pageNum });
          if (end === para.length) break;
          start = end - CHUNK_OVERLAP;
        }
        buffer = '';
      }
    }
  }
  if (buffer) chunks.push({ text: buffer, pageNum });

  return chunks;
}

/**
 * Index document: split into chunks, embed via Web Worker.
 */
export async function indexDocument(
  caseId: string,
  evidenceKey: string,
  pages: { pageNum: number; text: string }[],
  onProgress?: ProgressCallback,
): Promise<number> {
  console.log('[Embedding] indexDocument called:', caseId, evidenceKey, pages.length, 'pages');
  await ensureWorkerReady(onProgress);
  console.log('[Embedding] Worker ready, proceeding...');

  // Remove old chunks
  console.log('[Embedding] Deleting old chunks...');
  await db.documentChunks.where('documentId').equals(`${caseId}/${evidenceKey}`).delete();
  console.log('[Embedding] Old chunks deleted');

  // Create chunks
  const allChunks: { text: string; pageNum?: number }[] = [];
  for (const page of pages) {
    if (!page.text.trim()) continue;
    allChunks.push(...splitIntoChunks(page.text, page.pageNum));
  }

  console.log(`[Embedding] Start: ${allChunks.length} chunks from ${pages.length} pages`);
  const t0 = performance.now();

  const documentId = `${caseId}/${evidenceKey}`;
  for (let i = 0; i < allChunks.length; i++) {
    onProgress?.({
      status: `Embedding ${i + 1}/${allChunks.length}...`,
      step: 'indexing',
      progress: (i / allChunks.length) * 100,
    });

    if (i < 3) console.log(`[Embedding] Chunk ${i}: sending to worker (${allChunks[i].text.length} chars)`);
    const vector = await embedViaWorker(i, allChunks[i].text, 'passage');
    if (i < 3) console.log(`[Embedding] Chunk ${i}: got vector[${vector.length}]`);

    const chunk: DocumentChunk = {
      id: `${documentId}/${i}`,
      documentId,
      caseId,
      chunkIndex: i,
      text: allChunks[i].text,
      pageNum: allChunks[i].pageNum,
      vector,
    };
    await db.documentChunks.put(chunk);

    if ((i + 1) % 10 === 0) {
      const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
      const rate = ((i + 1) / parseFloat(elapsed)).toFixed(1);
      console.log(`[Embedding] ${i + 1}/${allChunks.length} | ${elapsed}s | ${rate} chunks/s`);
    }
  }

  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
  console.log(`[Embedding] Done: ${allChunks.length} chunks in ${elapsed}s`);
  onProgress?.({ status: `Gotowe — ${allChunks.length} fragmentow (${elapsed}s)`, step: 'done', progress: 100 });
  return allChunks.length;
}

/**
 * Semantic search: embed query via worker, compare with stored chunk vectors.
 */
export async function searchChunks(
  caseId: string,
  evidenceKey: string,
  query: string,
  topK = 3,
  onProgress?: ProgressCallback,
): Promise<DocumentChunk[]> {
  const documentId = `${caseId}/${evidenceKey}`;
  const chunks = await db.documentChunks.where('documentId').equals(documentId).toArray();

  if (chunks.length === 0) return [];

  onProgress?.({ status: 'Szukam w umowie...', step: 'indexing' });
  await ensureWorkerReady(onProgress);
  const queryVector = await embedViaWorker(-1, query, 'query');

  // Keyword boost: chunks containing query words get a bonus
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = chunks
    .filter(c => c.vector.length > 0)
    .map(chunk => {
      const semantic = cosineSimilarity(queryVector, chunk.vector);
      const textLower = chunk.text.toLowerCase();
      const keywordHits = queryWords.filter(w => textLower.includes(w)).length;
      const keywordBonus = queryWords.length > 0 ? (keywordHits / queryWords.length) * 0.15 : 0;
      return {
        chunk,
        score: semantic + keywordBonus,
        semantic,
        keywordHits,
      };
    });

  scored.sort((a, b) => b.score - a.score);

  const results = scored.slice(0, topK);
  console.log(`[RAG] ===== SEARCH =====`);
  console.log(`[RAG] Query: "${query}" | keywords: [${queryWords.join(', ')}]`);
  console.log(`[RAG] Searched ${chunks.length} chunks, top ${topK}:`);
  for (const r of results) {
    console.log(`[RAG]   score=${r.score.toFixed(3)} (sem=${r.semantic.toFixed(3)} +kw=${r.keywordHits}) | ${r.chunk.text.slice(0, 120)}...`);
  }

  return results.map(s => s.chunk);
}

export async function isDocumentIndexed(caseId: string, evidenceKey: string): Promise<boolean> {
  const count = await db.documentChunks.where('documentId').equals(`${caseId}/${evidenceKey}`).count();
  return count > 0;
}

export async function deleteDocumentIndex(caseId: string, evidenceKey: string): Promise<void> {
  await db.documentChunks.where('documentId').equals(`${caseId}/${evidenceKey}`).delete();
}
