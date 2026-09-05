export class ApiError extends Error {
  type: 'no-key' | 'api' | 'network' | 'not-found' | 'rate-limit' | 'permission' | 'unknown';
  status?: number;

  constructor(
    type: 'no-key' | 'api' | 'network' | 'not-found' | 'rate-limit' | 'permission' | 'unknown',
    message: string,
    status?: number
  ) {
    super(message);
    this.type = type;
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function safeFetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 12000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (res.status === 429) {
      throw new ApiError('rate-limit', 'The weather service is busy. Please try again shortly.', 429);
    }
    if (res.status >= 400 && res.status < 500) {
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.message ?? body?.reason ?? '';
      } catch {
        /* ignore */
      }
      throw new ApiError('api', detail || 'The weather service rejected the request.', res.status);
    }
    if (!res.ok) {
      throw new ApiError('api', 'The weather service had a problem.', res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('network', 'The request took too long. Check your connection.');
    }
    throw new ApiError('network', 'Could not reach the weather service.');
  } finally {
    clearTimeout(timer);
  }
}
