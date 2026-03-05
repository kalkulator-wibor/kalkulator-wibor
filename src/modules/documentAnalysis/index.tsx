import type { AppModule } from '../types';
import { FileSearch } from 'lucide-react';
import DocumentAnalysisPanel from './DocumentAnalysisPanel';

const documentAnalysis: AppModule = {
  id: 'documentAnalysis',
  label: 'Analiza umowy',
  description: 'Ekstrakcja tekstu i analiza umowy kredytu z PDF',
  icon: FileSearch,
  type: 'sheet',
  Component: DocumentAnalysisPanel,
  alwaysEnabled: true,
  showInHeader: false,
};

export default documentAnalysis;
