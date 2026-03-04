import type { AppModule } from '../types';
import { PercentIcon } from '../../components/ui/Icons';
import { Panel } from '../../components/ui/Panel';

function ZeroPercentView() {
  return (
    <Panel className="p-12 text-center max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Scenariusz: Kredyt 0%</h2>
      <p className="text-gray-500">
        Symulacja usunięcia zarówno WIBOR jak i marży z umowy kredytowej. Kredytobiorca spłaca wyłącznie kapitał bez jakichkolwiek odsetek.
      </p>
    </Panel>
  );
}

const zeroPercent: AppModule = {
  id: 'zeroPercent',
  label: 'Kredyt 0%',
  description: 'Usunięcie WIBOR i marży — spłata wyłącznie kapitału',
  icon: PercentIcon,
  type: 'page',
  Component: ZeroPercentView,
  comingSoon: true,
};

export default zeroPercent;
