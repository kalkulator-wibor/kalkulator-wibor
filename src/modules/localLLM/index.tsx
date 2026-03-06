import type { AppModule } from '../types';
import { Bot } from 'lucide-react';
import LocalLLMPanel from './LocalLLMPanel';

const localLLM: AppModule = {
  id: 'localLLM',
  label: 'Bielik AI',
  description: 'Lokalny model AI (Bielik 1.5B) do analizy umów kredytowych',
  icon: Bot,
  type: 'sheet',
  Component: LocalLLMPanel,
  alwaysEnabled: true,
};

export default localLLM;
