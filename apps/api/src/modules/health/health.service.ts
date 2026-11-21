import { healthRepository, type HealthRepository } from './health.repository';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  uptime: number;
}

export function createHealthService(repository: HealthRepository = healthRepository) {
  return {
    async check(): Promise<HealthStatus> {
      const databaseUp = await repository.pingDatabase();
      return {
        status: databaseUp ? 'ok' : 'degraded',
        database: databaseUp ? 'up' : 'down',
        uptime: Math.round(process.uptime()),
      };
    },
  };
}

export const healthService = createHealthService();
