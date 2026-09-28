import { env } from '$env/dynamic/public';
import { createMockApiResponse } from './mock';
import { clearSession, restoreSession, persistSession } from '$lib/auth/session';
import { _ } from '$lib/i18n';
import type { OAuth2TokenResponse } from '$lib/types';
import { get } from 'svelte/store';
import { toast } from 'svelte-sonner';

export type Fetcher = typeof fetch;

export type ApiTarget = 'wikiforge';
export const API_TIMEOUT_MS = 12_000;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
	body?: unknown;
	fetch?: Fetcher;
	skipAuth?: boolean;
	/** All endpoints are served by the WikiForge public API. */
	apiTarget?: ApiTarget;
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

export class ApiTimeoutError extends Error {
	constructor() {
		super('La requête API a dépassé le délai maximal de 12 secondes.');
		this.name = 'ApiTimeoutError';
	}
}

function timeoutMessage() {
	return get(_)('common.api_timeout');
}

function notifyApiTimeout() {
	if (typeof window !== 'undefined') toast.error(timeoutMessage());
}

function combinedSignal(signal: AbortSignal | null | undefined, timeoutSignal: AbortSignal) {
	if (!signal) return timeoutSignal;
	return AbortSignal.any([signal, timeoutSignal]);
}

async function withApiTimeout<T>(
	operation: (signal: AbortSignal) => Promise<T>,
	signal?: AbortSignal | null
): Promise<T> {
	const timeoutController = new AbortController();
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			timeoutController.abort();
			reject(new ApiTimeoutError());
		}, API_TIMEOUT_MS);
	});

	try {
		return await Promise.race([
			operation(combinedSignal(signal, timeoutController.signal)),
			timeout
		]);
	} finally {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
	}
}

function fetchWithTimeout(fetcher: Fetcher, input: RequestInfo | URL, init: RequestInit) {
	return withApiTimeout((signal) => fetcher(input, { ...init, signal }), init.signal);
}

export function apiUrl(path: string, apiTarget: ApiTarget = 'wikiforge'): string {
	void apiTarget;
	// `PUBLIC_CARDS_API_BASE_URL` was the initial name of the WikiForge API URL.
	// Keep it as a deployment-only compatibility alias: it never targets the retired API.
	const baseUrl = (env.PUBLIC_WIKIFORGE_API_BASE_URL ?? env.PUBLIC_CARDS_API_BASE_URL)?.replace(
		/\/$/,
		''
	);
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
let refreshGeneration = 0;
let refreshDisabled = false;
const accessTokenRefreshMarginMs = 30_000;

function tokenNeedsRefresh(session: ReturnType<typeof restoreSession>) {
	return Boolean(
		session?.accessToken &&
		session.refreshToken &&
		session.accessTokenExpiresAt !== undefined &&
		session.accessTokenExpiresAt <= Date.now() + accessTokenRefreshMarginMs
	);
}

export async function refreshSession(fetcher: Fetcher = fetch): Promise<boolean> {
	if (refreshDisabled) return false;
	if (refreshSessionPromise) return refreshSessionPromise;

	refreshSessionPromise = (async () => {
		const generation = refreshGeneration;
		const session = restoreSession(localStorage);
		if (!session?.refreshToken) return false;

		try {
			const response = await fetchWithTimeout(fetcher, apiUrl('/oauth2/token', 'wikiforge'), {
				method: 'POST',
				credentials: 'include',
				headers: {
					accept: 'application/json',
					'content-type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					grant_type: 'refresh_token',
					refresh_token: session.refreshToken
				})
			});
			if (!response.ok) return false;

			const tokens = (await response.json()) as OAuth2TokenResponse;
			if (!tokens.access_token) return false;
			if (refreshDisabled || generation !== refreshGeneration) return false;
			const currentSession = restoreSession(localStorage);
			if (!currentSession || currentSession.refreshToken !== session.refreshToken) return false;
			persistSession(localStorage, {
				...currentSession,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token || session.refreshToken,
				accessTokenExpiresAt:
					Number.isFinite(Number(tokens.expires_in)) && Number(tokens.expires_in) > 0
						? Date.now() + Number(tokens.expires_in) * 1_000
						: undefined
			});
			return true;
		} catch (error) {
			if (error instanceof ApiTimeoutError) notifyApiTimeout();
			return false;
		}
	})();

	try {
		return await refreshSessionPromise;
	} finally {
		refreshSessionPromise = null;
	}
}

export function disableWikiForgeSessionRefresh() {
	refreshDisabled = true;
	refreshGeneration += 1;
}

export function enableWikiForgeSessionRefresh() {
	refreshDisabled = false;
	refreshGeneration += 1;
}

function redirectToLogin() {
	if (typeof window === 'undefined' || window.location.pathname === '/login') return;
	const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
	window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	try {
		return await request<T>(path, options, false);
	} catch (error) {
		if (error instanceof ApiTimeoutError) notifyApiTimeout();
		throw error;
	}
}

async function request<T>(path: string, options: RequestOptions, didRefresh: boolean): Promise<T> {
	const {
		body,
		fetch: fetcher = fetch,
		headers,
		skipAuth = false,
		apiTarget = 'wikiforge',
		...init
	} = options;
	let session = typeof localStorage === 'undefined' ? null : restoreSession(localStorage);
	if (
		!didRefresh &&
		!skipAuth &&
		apiTarget === 'wikiforge' &&
		tokenNeedsRefresh(session) &&
		(await refreshSession(fetcher))
	) {
		session = restoreSession(localStorage);
	}
	const accessToken = skipAuth ? undefined : session?.accessToken;
	const response = isMockApiEnabled()
		? await withApiTimeout(async () => {
				const delay = mockDelay();
				if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
				return createMockApiResponse({ path, method: init.method, body });
			}, init.signal)
		: await fetchWithTimeout(fetcher, apiUrl(path, apiTarget), {
				credentials: 'include',
				headers: {
					accept: 'application/json',
					...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
					...(body === undefined
						? {}
						: body instanceof URLSearchParams
							? { 'content-type': 'application/x-www-form-urlencoded' }
							: { 'content-type': 'application/json' }),
					...headers
				},
				body:
					body === undefined
						? undefined
						: body instanceof URLSearchParams
							? body
							: JSON.stringify(body),
				...init
			});

	const isAuthenticationFailure = response.status === 401;
	const canRefresh =
		!didRefresh &&
		!skipAuth &&
		apiTarget === 'wikiforge' &&
		isAuthenticationFailure &&
		typeof localStorage !== 'undefined' &&
		!path.startsWith('/oauth2/') &&
		!path.startsWith('/auth/');

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
				: typeof payload === 'object' &&
					  payload &&
					  'error' in payload &&
					  typeof payload.error === 'string'
					? payload.error
					: `Erreur API (${response.status})`;
		if (
			response.status === 403 &&
			payload &&
			typeof payload === 'object' &&
			(('error' in payload && payload.error === 'SANCTIONED') ||
				('code' in payload && payload.code === 'SANCTIONED')) &&
			'meta' in payload
		) {
			void import('$lib/moderation/state').then(({ acceptSanction }) =>
				acceptSanction(payload.meta)
			);
		}
		throw new ApiError(response.status, payload, message);
	}

	return payload as T;
}
