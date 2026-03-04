import type { TabModule } from '../types';
import ComparisonView from './ComparisonView';

const comparisonModule: TabModule = {
  id: 'comparison',
  label: 'Porównanie',
  Component: ComparisonView,
};

export default comparisonModule;
