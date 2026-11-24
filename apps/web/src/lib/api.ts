// Cliente HTTP único del frontend. Todas las llamadas a la API pasan por aquí
// (Specs #2 y #3 lo reutilizan). Convierte el formato de error común de la API
// en un ApiError con código y mensaje en español.

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown[] };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

/** Lo usará el Spec #3 tras iniciar sesión. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** La capa de autenticación puede registrar su logout para respuestas 401. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No pudimos conectar con el servidor. Revisa que la API esté encendida.');
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      authToken = null;
      unauthorizedHandler?.();
    }

    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `El servidor respondió con el estado ${response.status}.`,
      error?.details ?? [],
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, data?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
