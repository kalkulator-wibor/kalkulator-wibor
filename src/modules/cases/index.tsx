import type { AppModule } from '../types';
import { FolderOpen } from 'lucide-react';
import CasesPanel from './CasesPanel';

const cases: AppModule = {
  id: 'cases',
  label: 'Sprawy',
  description: 'Zarządzanie sprawami klientów',
  icon: FolderOpen,
  type: 'sheet',
  Component: CasesPanel,
};

export default cases;
