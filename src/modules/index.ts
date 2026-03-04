import type { TabModule, AppModule } from './types';
import summary from './summary';
import schedule from './schedule';
import comparison from './comparison';
import breakdown from './breakdown';
import calculator from './calculator';
import zeroPercent from './zeroPercent';
import invalidation from './invalidation';
import cases from './cases';
import wiborData from './wiborData';

export const tabModules: TabModule[] = [summary, breakdown, comparison, schedule];
export const appModules: AppModule[] = [calculator, zeroPercent, invalidation, cases, wiborData];
