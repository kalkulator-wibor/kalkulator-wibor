import type { TabModule } from '../types';
import SummaryView from './SummaryView';

const summaryModule: TabModule = {
  id: 'summary',
  label: 'Podsumowanie',
  Component: SummaryView,
};

export default summaryModule;
