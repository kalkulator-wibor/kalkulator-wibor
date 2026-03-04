import type { AppModule } from '../types';
import { Calculator } from 'lucide-react';
import CalculatorView from './CalculatorView';

const calculator: AppModule = {
  id: 'calculator',
  label: 'Odwiborowanie',
  description: 'Usunięcie WIBOR z umowy, kredyt oparty wyłącznie o marżę banku',
  icon: Calculator,
  type: 'page',
  Component: CalculatorView,
  alwaysEnabled: true,
};

export default calculator;
