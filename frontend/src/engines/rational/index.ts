import type { EngineModule } from '../../types';
import { createApiEngine } from './apiEngine';
import { RATIONAL_DEFAULTS } from './config';

/** 理性讨论引擎：调用 backend/服务.py（人格数据库的 讨论引擎.py） */
export const rationalEngine: EngineModule = {
  mode: 'rational',
  name: '理性讨论引擎（人格数据库）',
  owner: 'backend/服务.py',
  create: createApiEngine,
  defaults: RATIONAL_DEFAULTS,
};
