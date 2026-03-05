import type { TabModule } from '../types';
import LawsuitView from './LawsuitView';

const lawsuitModule: TabModule = {
  id: 'analysis',
  label: 'Analiza',
  Component: LawsuitView,
};

export default lawsuitModule;
