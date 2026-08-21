/**
 * TaskMate API Client
 *
 * This app uses the existing Supabase session for all authenticated requests.
 * The bearer-token localStorage stub is intentionally removed because it is not
 * used and it creates an unsafe duplicate authentication path.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * Current app behavior: all auth-sensitive operations are handled through the
 * active Supabase session in AuthContext and Supabase client calls.
 * This helper remains available for future backend integration without using
 * localStorage tokens.
 */
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'API error');
  }

  return res.json() as Promise<T>;
}
