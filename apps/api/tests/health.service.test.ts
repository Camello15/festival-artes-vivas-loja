import { describe, expect, it } from 'vitest';
import { createHealthService } from '../src/modules/health/health.service';

describe('healthService.check', () => {
  it('reporta "ok" cuando la base de datos responde', async () => {
    const service = createHealthService({ pingDatabase: async () => true });
    await expect(service.check()).resolves.toMatchObject({ status: 'ok', database: 'up' });
  });

  it('reporta "degraded" cuando la base de datos no responde', async () => {
    const service = createHealthService({ pingDatabase: async () => false });
    await expect(service.check()).resolves.toMatchObject({ status: 'degraded', database: 'down' });
  });
});
