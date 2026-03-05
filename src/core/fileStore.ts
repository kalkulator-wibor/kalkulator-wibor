import { db } from './db';
import type { CaseFile } from './types';
import { deleteDocumentText, deleteAllDocumentTexts } from './ocrPipeline';

async function getCaseDir(caseId: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const casesDir = await root.getDirectoryHandle('cases', { create: true });
  return casesDir.getDirectoryHandle(caseId, { create: true });
}

export async function uploadFile(caseId: string, evidenceKey: string, file: File): Promise<CaseFile> {
  const dir = await getCaseDir(caseId);
  const handle = await dir.getFileHandle(evidenceKey, { create: true });
  const writable = await handle.createWritable();
  await writable.write(file);
  await writable.close();

  const meta: CaseFile = {
    id: `${caseId}/${evidenceKey}`,
    caseId,
    evidenceKey,
    fileName: file.name,
    size: file.size,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
  };
  await db.caseFiles.put(meta);
  return meta;
}

export async function deleteFile(caseId: string, evidenceKey: string): Promise<void> {
  try {
    const dir = await getCaseDir(caseId);
    await dir.removeEntry(evidenceKey);
  } catch {}
  await db.caseFiles.delete(`${caseId}/${evidenceKey}`);
  await deleteDocumentText(caseId, evidenceKey);
}

export async function openFile(caseId: string, evidenceKey: string, fileName: string): Promise<void> {
  try {
    const dir = await getCaseDir(caseId);
    const handle = await dir.getFileHandle(evidenceKey);
    const file = await handle.getFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    // Browsers that support blob URL in new tab will show it; others will download
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {}
}

export async function getFile(caseId: string, evidenceKey: string): Promise<File | null> {
  try {
    const dir = await getCaseDir(caseId);
    const handle = await dir.getFileHandle(evidenceKey);
    return await handle.getFile();
  } catch {
    return null;
  }
}

export async function getFilesForCase(caseId: string): Promise<CaseFile[]> {
  return db.caseFiles.where('caseId').equals(caseId).toArray();
}

export async function deleteAllCaseFiles(caseId: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    const casesDir = await root.getDirectoryHandle('cases', { create: true });
    await casesDir.removeEntry(caseId, { recursive: true });
  } catch {}
  await db.caseFiles.where('caseId').equals(caseId).delete();
  await deleteAllDocumentTexts(caseId);
}
