import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { db } from './db';
import type { DocumentText, PageText } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const MIN_TEXT_LENGTH = 50;

export interface ExtractionProgress {
  page: number;
  totalPages: number;
  method: 'textLayer' | 'ocr';
  status: 'extracting' | 'done' | 'error';
}

type ProgressCallback = (p: ExtractionProgress) => void;

async function extractTextLayer(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();
  return content.items
    .filter(item => 'str' in item)
    .map(item => (item as { str: string }).str)
    .join(' ')
    .trim();
}

async function ocrPage(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<{ text: string; confidence: number }> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport, canvas } as any).promise;
  const blob = await canvas.convertToBlob({ type: 'image/png' });

  const { data } = await Tesseract.recognize(blob, 'pol', {
    logger: () => {},
  });
  return { text: data.text.trim(), confidence: data.confidence };
}

export async function extractTextFromPdf(
  file: File,
  caseId: string,
  evidenceKey: string,
  onProgress?: ProgressCallback,
): Promise<DocumentText> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const totalPages = pdf.numPages;
  const pages: PageText[] = [];

  for (let i = 1; i <= totalPages; i++) {
    // Try text layer first
    onProgress?.({ page: i, totalPages, method: 'textLayer', status: 'extracting' });
    const textLayerResult = await extractTextLayer(pdf, i);

    if (textLayerResult.replace(/\s/g, '').length >= MIN_TEXT_LENGTH) {
      pages.push({ pageNum: i, text: textLayerResult, method: 'textLayer' });
      onProgress?.({ page: i, totalPages, method: 'textLayer', status: 'done' });
      continue;
    }

    // Fallback to OCR
    onProgress?.({ page: i, totalPages, method: 'ocr', status: 'extracting' });
    try {
      const { text, confidence } = await ocrPage(pdf, i);
      pages.push({ pageNum: i, text, method: 'ocr', confidence });
      onProgress?.({ page: i, totalPages, method: 'ocr', status: 'done' });
    } catch {
      pages.push({ pageNum: i, text: '', method: 'ocr', confidence: 0 });
      onProgress?.({ page: i, totalPages, method: 'ocr', status: 'error' });
    }
  }

  pdf.destroy();

  const doc: DocumentText = {
    id: `${caseId}/${evidenceKey}`,
    caseId,
    evidenceKey,
    pages,
    extractedAt: new Date().toISOString(),
  };
  await db.documentTexts.put(doc);
  return doc;
}

export async function getDocumentText(caseId: string, evidenceKey: string): Promise<DocumentText | undefined> {
  return db.documentTexts.get(`${caseId}/${evidenceKey}`);
}

export async function deleteDocumentText(caseId: string, evidenceKey: string): Promise<void> {
  await db.documentTexts.delete(`${caseId}/${evidenceKey}`);
}

export async function deleteAllDocumentTexts(caseId: string): Promise<void> {
  await db.documentTexts.where('caseId').equals(caseId).delete();
}

export function getFullText(doc: DocumentText): string {
  return doc.pages.map(p => p.text).join('\n\n');
}
