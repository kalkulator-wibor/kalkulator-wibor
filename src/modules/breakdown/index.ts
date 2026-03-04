import type { TabModule } from '../types';
import BreakdownView from './BreakdownView';

const breakdownModule: TabModule = {
  id: 'breakdown',
  label: 'Struktura odsetek',
  Component: BreakdownView,
};

export default breakdownModule;
