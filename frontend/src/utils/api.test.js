import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchWithAuth } from './api';

describe('fetchWithAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('attache le header Authorization quand un token est présent', async () => {
    localStorage.setItem('access_token', 'abc123');
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithAuth('/api/mesures');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/mesures',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      })
    );
  });

  it("n'ajoute pas de header Authorization sans token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithAuth('/api/mesures');

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it('émet auth:unauthorized sur une réponse 401', async () => {
    localStorage.setItem('access_token', 'expired');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);

    await fetchWithAuth('/api/mesures');

    expect(handler).toHaveBeenCalled();
    window.removeEventListener('auth:unauthorized', handler);
  });
});
