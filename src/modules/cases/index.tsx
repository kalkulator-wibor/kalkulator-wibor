import type { AppModule } from '../types';
import { DocumentIcon } from '../../components/ui/Icons';
import CasesPanel from './CasesPanel';

const cases: AppModule = {
  id: 'cases',
  label: 'Sprawy',
  description: 'Zarządzanie sprawami klientów',
  icon: DocumentIcon,
  type: 'sheet',
  Component: CasesPanel,
};

export default cases;
