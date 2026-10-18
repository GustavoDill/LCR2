let idTokenProvider: (() => Promise<string | null>) | null = null;
let currentRoleOverride: 'bishopric' | 'council' | null = null;

export function setTokenProvider(provider: () => Promise<string | null>) {
  idTokenProvider = provider;
}

export function setRoleOverride(role: 'bishopric' | 'council' | null) {
  currentRoleOverride = role;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (idTokenProvider) {
    try {
      const token = await idTokenProvider();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (err) {
      console.warn('Failed to get auth token:', err);
    }
  }

  if (currentRoleOverride) {
    headers.set('x-role', currentRoleOverride);
  }

  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const url = endpoint.startsWith('http')
    ? endpoint
    : baseApiUrl
      ? `${baseApiUrl}${cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`}`
      : cleanPath.startsWith('/api/') || cleanPath === '/api'
        ? cleanPath
        : `/api${cleanPath}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Erro ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // not JSON
    }

    if (response.status === 401 && !url.includes('/auth/me')) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    throw new Error(errorMsg);
  }

  // Handle blob responses (e.g. CSV or PDF downloads)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv') || contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
    return (await response.blob()) as unknown as T;
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string, headers?: Record<string, string>) => apiRequest<T>(url, { method: 'GET', headers }),
  post: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined, headers }),
  put: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, headers }),
  delete: <T = any>(url: string, headers?: Record<string, string>) => apiRequest<T>(url, { method: 'DELETE', headers }),
};
