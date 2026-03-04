import type { AppModule } from '../types';
import { InfoIcon } from '../../components/ui/Icons';
import WiborDataManager from '../../core-ui/WiborDataManager';
import { useCases } from '../../core/CaseContext';

function WiborDataPanel() {
  const { wiborData, updateWiborData } = useCases();
  return <WiborDataManager wiborData={wiborData} onDataUpdate={updateWiborData} />;
}

const wiborData: AppModule = {
  id: 'wiborData',
  label: 'Dane WIBOR',
  description: 'Podgląd, import i eksport stawek WIBOR 3M',
  icon: InfoIcon,
  type: 'sheet',
  Component: WiborDataPanel,
  alwaysEnabled: true,
  showInHeader: false,
};

export default wiborData;
