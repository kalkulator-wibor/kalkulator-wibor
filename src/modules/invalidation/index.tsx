import type { AppModule } from '../types';
import { BanIcon } from '../../components/ui/Icons';
import { Panel } from '../../components/ui/Panel';

function InvalidationView() {
  return (
    <Panel className="p-12 text-center max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Scenariusz: Unieważnienie umowy</h2>
      <p className="text-gray-500">
        Symulacja całkowitego unieważnienia umowy kredytowej. Strony zwracają sobie wzajemne świadczenia — bank oddaje odsetki, kredytobiorca oddaje kapitał.
      </p>
    </Panel>
  );
}

const invalidation: AppModule = {
  id: 'invalidation',
  label: 'Unieważnienie',
  description: 'Unieważnienie umowy kredytowej — wzajemny zwrot świadczeń',
  icon: BanIcon,
  type: 'page',
  Component: InvalidationView,
  comingSoon: true,
};

export default invalidation;
