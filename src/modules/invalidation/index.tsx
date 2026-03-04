import type { AppModule } from '../types';
import { Ban } from 'lucide-react';

function InvalidationView() {
  return (
    <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
      <div className="card-body items-center text-center py-12">
        <h2 className="card-title">Scenariusz: Unieważnienie umowy</h2>
        <p className="opacity-60">Symulacja całkowitego unieważnienia umowy kredytowej. Strony zwracają sobie wzajemne świadczenia — bank oddaje odsetki, kredytobiorca oddaje kapitał.</p>
      </div>
    </div>
  );
}

const invalidation: AppModule = {
  id: 'invalidation',
  label: 'Unieważnienie',
  description: 'Unieważnienie umowy kredytowej — wzajemny zwrot świadczeń',
  icon: Ban,
  type: 'page',
  Component: InvalidationView,
  comingSoon: true,
};

export default invalidation;
