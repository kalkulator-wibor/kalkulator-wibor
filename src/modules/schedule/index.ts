import type { TabModule } from '../types';
import ScheduleView from './ScheduleView';

const scheduleModule: TabModule = {
  id: 'schedule',
  label: 'Harmonogram',
  Component: ScheduleView,
};

export default scheduleModule;
