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

let refreshSessionPromise: Promise<boolean> | null = null;

async function refreshSession(fetcher: Fetcher): Promise<boolean> {
	if (refreshSessionPromise) return refreshSessionPromise;

	refreshSessionPromise = (async () => {
		const session = restoreSession(localStorage);
		if (!session?.refreshToken) return false;

		try {
			const response = await fetcher(apiUrl('/api/auth/refresh'), {
				method: 'POST',
				credentials: 'include',
				headers: { accept: 'application/json', 'content-type': 'application/json' },
				body: JSON.stringify({ refreshToken: session.refreshToken })
			});
			if (!response.ok) return false;

			const tokens = await response.json();
			persistSession(localStorage, { ...session, ...tokens });
			return true;
		} catch {
			return false;
		}
	})();

	try {
		return await refreshSessionPromise;
	} finally {
		refreshSessionPromise = null;
	}
}

function redirectToLogin() {
	if (typeof window === 'undefined' || window.location.pathname === '/login') return;
	const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
	window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	return request<T>(path, options, false);
}

async function request<T>(path: string, options: RequestOptions, didRefresh: boolean): Promise<T> {
	const { body, fetch: fetcher = fetch, headers, ...init } = options;
	const session = typeof localStorage === 'undefined' ? null : restoreSession(localStorage);
	const accessToken = session?.accessToken;
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
					...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
					...(body === undefined ? {} : { 'content-type': 'application/json' }),
					...headers
				},
				body: body === undefined ? undefined : JSON.stringify(body),
				...init
			});

	const isAuthenticationFailure = response.status === 401 || response.status === 403;
	const canRefresh =
		!didRefresh &&
		isAuthenticationFailure &&
		typeof localStorage !== 'undefined' &&
		!path.startsWith('/api/auth/');

	if (canRefresh) {
		const currentSession = restoreSession(localStorage);
		const tokenWasAlreadyRenewed =
			Boolean(accessToken) && currentSession?.accessToken !== accessToken;
		const refreshed = tokenWasAlreadyRenewed || (await refreshSession(fetcher));
		if (refreshed) return request<T>(path, options, true);

		clearSession(localStorage);
		redirectToLogin();
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
