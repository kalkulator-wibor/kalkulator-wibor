import type { AppModule } from '../types';
import { Percent } from 'lucide-react';

function ZeroPercentView() {
  return (
    <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
      <div className="card-body items-center text-center py-12">
        <h2 className="card-title">Scenariusz: Kredyt 0%</h2>
        <p className="opacity-60">Symulacja usunięcia zarówno WIBOR jak i marży z umowy kredytowej. Kredytobiorca spłaca wyłącznie kapitał bez jakichkolwiek odsetek.</p>
      </div>
    </div>
  );
}

const zeroPercent: AppModule = {
  id: 'zeroPercent',
  label: 'Kredyt 0%',
  description: 'Usunięcie WIBOR i marży — spłata wyłącznie kapitału',
  icon: Percent,
  type: 'page',
  Component: ZeroPercentView,
  comingSoon: true,
};

export default zeroPercent;
