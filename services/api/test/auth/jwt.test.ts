import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  resetAuthConfig,
  setAuthConfig,
  signJwt,
  verifyJwt,
} from '../../src/auth/index.js';
import { ForgelyError } from '../../src/errors.js';

describe('auth/jwt', () => {
  beforeEach(() => {
    setAuthConfig({
      jwtSecret: 'test_secret_test_secret_test_secret_test_secret',
      jwtAccessTtlSeconds: 60,
      jwtIssuer: 'forgely.test',
      jwtAudience: 'forgely-test',
    });
  });

  afterEach(() => {
    resetAuthConfig();
  });

  it('round-trips a payload through sign + verify', async () => {
    const token = await signJwt({
      sub: 'user_123',
      role: 'user',
      sid: 'sess_abc',
      plan: 'pro',
    });
    const payload = await verifyJwt(token);
    expect(payload).toMatchObject({
      sub: 'user_123',
      role: 'user',
      sid: 'sess_abc',
      plan: 'pro',
    });
  });

  it('rejects an obviously corrupted token', async () => {
    await expect(verifyJwt('not.a.real.jwt')).rejects.toBeInstanceOf(ForgelyError);
  });

  it('rejects tokens signed with a different secret', async () => {
    const token = await signJwt({ sub: 'u', role: 'user', sid: 's' });
    setAuthConfig({ jwtSecret: 'a_completely_different_secret_for_this_run' });
    await expect(verifyJwt(token)).rejects.toBeInstanceOf(ForgelyError);
  });

  it('rejects tokens whose audience differs', async () => {
    const token = await signJwt({ sub: 'u', role: 'user', sid: 's' });
    setAuthConfig({ jwtAudience: 'someone-else' });
    await expect(verifyJwt(token)).rejects.toBeInstanceOf(ForgelyError);
  });

  it('flags an expired token with TOKEN_EXPIRED', async () => {
    setAuthConfig({ jwtAccessTtlSeconds: -1 });
    const token = await signJwt({ sub: 'u', role: 'user', sid: 's' });
    await expect(verifyJwt(token)).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
    });
  });
});
