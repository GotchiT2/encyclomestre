import { env } from '$env/dynamic/public';
import { createMockApiResponse } from './mock';
import { clearSession, restoreSession, persistSession } from '$lib/auth/session';

export type Fetcher = typeof fetch;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
	body?: unknown;
	fetch?: Fetcher;
}

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly payload: unknown,
		message = 'La requête API a échoué.'
	) {
		super(message);
		this.name = 'ApiError';
	}
}

function apiUrl(path: string): string {
	const baseUrl = (env.PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
	return baseUrl ? `${baseUrl}${path}` : path;
}

/** Active l'interception API avec `PUBLIC_API_MOCK_ENABLED=true` ou `1`. */
export function isMockApiEnabled(): boolean {
	const value = env.PUBLIC_API_MOCK_ENABLED?.trim().toLowerCase();
	return value === 'true' || value === '1';
}

function mockDelay(): number {
	const value = Number(env.PUBLIC_API_MOCK_DELAY_MS ?? 400);
	return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	return request<T>(path, options, false);
}

async function request<T>(path: string, options: RequestOptions, didRefresh: boolean): Promise<T> {
	const { body, fetch: fetcher = fetch, headers, ...init } = options;
	const response = isMockApiEnabled()
		? await (async () => {
				const delay = mockDelay();
				if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
				return createMockApiResponse({ path, method: init.method, body });
			})()
		: await fetcher(apiUrl(path), {
				credentials: 'include',
				headers: {
					accept: 'application/json',
					...(typeof localStorage !== 'undefined' && restoreSession(localStorage)?.accessToken
						? { authorization: `Bearer ${restoreSession(localStorage)!.accessToken}` }
						: {}),
					...(body === undefined ? {} : { 'content-type': 'application/json' }),
					...headers
				},
				body: body === undefined ? undefined : JSON.stringify(body),
				...init
			});

	if (!didRefresh && response.status === 401 && typeof localStorage !== 'undefined') {
		const session = restoreSession(localStorage);
		if (session?.refreshToken) {
			const refreshed = await fetcher(apiUrl('/api/auth/refresh'), {
				method: 'POST',
				headers: { accept: 'application/json', 'content-type': 'application/json' },
				body: JSON.stringify({ refreshToken: session.refreshToken })
			});
			if (refreshed.ok) {
				const tokens = await refreshed.json();
				persistSession(localStorage, { ...session, ...tokens });
				return request<T>(path, options, true);
			}
		}
		clearSession(localStorage);
		if (typeof window !== 'undefined')
			window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
	}

	if (response.status === 204) return undefined as T;

	const payload: unknown = await response.json().catch(() => undefined);
	if (!response.ok) {
		const message =
			typeof payload === 'object' &&
			payload &&
			'message' in payload &&
			typeof payload.message === 'string'
				? payload.message
				: `Erreur API (${response.status})`;
		throw new ApiError(response.status, payload, message);
	}

	return payload as T;
}
