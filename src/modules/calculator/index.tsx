import type { AppModule } from '../types';
import { CalculatorIcon } from '../../components/ui/Icons';
import CalculatorView from './CalculatorView';

const calculator: AppModule = {
  id: 'calculator',
  label: 'Odwiborowanie',
  description: 'Usunięcie WIBOR z umowy, kredyt oparty wyłącznie o marżę banku',
  icon: CalculatorIcon,
  type: 'page',
  Component: CalculatorView,
  alwaysEnabled: true,
};

export default calculator;
