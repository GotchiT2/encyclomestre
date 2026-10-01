import type { PasskeyDTO } from './webauthn';
interface Reply {
	status: number;
	body?: unknown;
}
interface Ceremony {
	challenge: string;
	expires: number;
	kind: 'login' | 'signup' | 'recovery' | 'reauth';
	name?: string;
	replace?: boolean;
}
let records: PasskeyDTO[] = [];
let registration: { challenge: string; expires: number } | undefined;
const requests = new Map<string, Ceremony>();
const names = new Set(['demo']);
export let mockAccountName: string | undefined;
let codes = Array.from({ length: 10 }, (_, i) => `DEMO-RECOVERY-${i + 1}`);
export const mockRecoveryCount = () => codes.length;
const scenario = () =>
	typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem('wikiforge-passkey-scenario');
const encoded = () =>
	btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
const reply = (body?: unknown, status = 200): Reply => ({ status, body });
const fail = (status: number, error: string) => reply({ error }, status);
function challenge(credential: unknown) {
	try {
		const raw = (credential as { response: { clientDataJSON: string } }).response.clientDataJSON;
		return JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/'))).challenge;
	} catch {
		return undefined;
	}
}
function consume(requestId: string, credential: unknown, kind?: Ceremony['kind']) {
	const data = requests.get(requestId);
	requests.delete(requestId);
	return data &&
		(!kind || data.kind === kind) &&
		data.expires > Date.now() &&
		challenge(credential) === data.challenge
		? data
		: undefined;
}
export function validateMockReauthentication(raw: unknown) {
	const input = raw as
		{ recoveryCode?: string; requestId?: string; credential?: { id: string } } | undefined;
	if (input?.recoveryCode) {
		const normal = (v: string) => v.replace(/[^a-z0-9]/gi, '').toLowerCase();
		const index = codes.findIndex((code) => normal(code) === normal(input.recoveryCode!));
		if (index < 0) return false;
		codes.splice(index, 1);
		return true;
	}
	return !!(
		input?.requestId &&
		consume(input.requestId, input.credential, 'reauth') &&
		records.some((item) => item.id === input.credential?.id)
	);
}
const freshCodes = () => {
	codes = Array.from({ length: 10 }, () => encoded().slice(0, 16));
	return [...codes];
};
export function passkeyMock(
	path: string,
	method: string,
	raw?: unknown,
	headers?: HeadersInit
): Reply | undefined {
	const input =
		raw instanceof URLSearchParams
			? Object.fromEntries(raw)
			: typeof raw === 'string'
				? JSON.parse(raw)
				: (raw as Record<string, unknown> | undefined);
	const rpId = typeof location === 'undefined' ? 'localhost' : location.hostname;
	const creation = (value: string, name = 'Demo') => ({
		challenge: value,
		rp: { id: rpId, name: 'WikiForge mock' },
		user: { id: 'AQ', name, displayName: name },
		pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
		authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
		timeout: 60000,
		attestation: 'none',
		excludeCredentials: records.map((item) => ({ id: item.id, type: 'public-key' }))
	});
	if (
		method === 'POST' &&
		[
			'/public/passkeys/options',
			'/me/reauth/options',
			'/public/passkeys/signup/options',
			'/public/passkeys/recovery/options'
		].includes(path)
	) {
		const kind: Ceremony['kind'] = path.includes('signup')
			? 'signup'
			: path.includes('recovery')
				? 'recovery'
				: path.includes('reauth')
					? 'reauth'
					: 'login';
		if (
			(kind === 'signup' || (kind === 'recovery' && !input?.token)) &&
			(!new Headers(headers).get('CF-Turnstile-Response') || scenario() === 'captcha')
		)
			return fail(403, 'CAPTCHA_FAILED');
		const name = String(input?.name ?? '').trim();
		if (kind === 'signup' && (!name || name.length > 64)) return fail(400, 'INVALID_PARAMETER');
		if (kind === 'signup' && names.has(name)) return fail(409, 'ALREADY_EXISTS');
		if (
			kind === 'recovery' &&
			(input?.token
				? input.token !== 'mock-recovery-link'
				: name !== (mockAccountName ?? 'Demo') ||
					!validateMockReauthentication({ recoveryCode: input?.code }))
		)
			return fail(403, 'INVALID_CREDENTIALS');
		const requestId = encoded(),
			value = encoded();
		requests.set(requestId, {
			challenge: value,
			expires: Date.now() + 300000,
			kind,
			name,
			replace: !!input?.token
		});
		return reply({
			requestId,
			options:
				kind === 'signup' || kind === 'recovery'
					? creation(value, name || mockAccountName)
					: {
							challenge: value,
							rpId,
							timeout: 60000,
							userVerification: 'required',
							allowCredentials:
								kind === 'reauth'
									? records.map((item) => ({ id: item.id, type: 'public-key' }))
									: []
						}
		});
	}
	if (
		path === '/oauth2/token' &&
		method === 'POST' &&
		input?.grant_type === 'urn:wikiforge:grant-type:passkey'
	) {
		let credential: { id: string };
		try {
			credential = JSON.parse(String(input.credential));
		} catch {
			return fail(400, 'invalid_grant');
		}
		const data = consume(String(input.request_id), credential);
		if (!data || scenario() === 'invalid-grant' || scenario() === 'expired')
			return fail(400, 'invalid_grant');
		if (data.kind === 'login' && !records.some((item) => item.id === credential.id))
			return fail(400, 'invalid_grant');
		let recovery_codes: string[] | undefined;
		if (data.kind === 'signup' || data.kind === 'recovery') {
			if (data.kind === 'signup' && names.has(data.name!)) return fail(400, 'name_taken');
			if (data.kind === 'signup') {
				names.add(data.name!);
				mockAccountName = data.name;
			}
			if (data.replace) records = [];
			const stamp = new Date().toISOString();
			records.push({
				id: credential.id,
				label: 'Passkey',
				synced: true,
				createdAt: stamp,
				lastUsedAt: stamp
			});
			if (data.kind === 'signup' || data.replace) recovery_codes = freshCodes();
		}
		return reply({
			access_token: 'mock-passkey-token',
			refresh_token: 'mock-passkey-refresh',
			token_type: 'Bearer',
			expires_in: 3600,
			...(recovery_codes ? { recovery_codes } : {})
		});
	}
	if (path === '/me/passkeys' && method === 'GET')
		return reply(
			scenario() === 'limit'
				? Array.from({ length: 10 }, (_, i) => ({
						id: `fixture-${i}`,
						label: `Appareil ${i + 1}`,
						synced: true,
						createdAt: new Date().toISOString(),
						lastUsedAt: new Date().toISOString()
					}))
				: scenario() === 'empty' || !records.length
					? undefined
					: records
		);
	if (path === '/me/passkeys/options' && method === 'POST') {
		if (records.length >= 10 || scenario() === 'limit') return fail(409, 'PASSKEY_CONFLICT');
		registration = { challenge: encoded(), expires: Date.now() + 300000 };
		return reply(creation(registration.challenge));
	}
	if (path === '/me/passkeys' && method === 'POST') {
		if (!validateMockReauthentication(input?.reauth)) return fail(403, 'INVALID_CREDENTIALS');
		const credential = input?.credential as { id: string };
		if (
			!registration ||
			registration.expires < Date.now() ||
			challenge(credential) !== registration.challenge ||
			scenario() === 'expired'
		) {
			registration = undefined;
			return fail(400, 'PASSKEY_REJECTED');
		}
		registration = undefined;
		if (records.some((item) => item.id === credential.id) || records.length >= 10)
			return fail(409, 'PASSKEY_CONFLICT');
		const stamp = new Date().toISOString();
		const record = {
			id: credential.id,
			label: String(input?.label),
			synced: false,
			createdAt: stamp,
			lastUsedAt: stamp
		};
		records.push(record);
		return reply(record, 201);
	}
	if (path === '/me/recovery-codes' && method === 'POST')
		return validateMockReauthentication(input)
			? reply({ codes: freshCodes() })
			: fail(403, 'INVALID_CREDENTIALS');
	if (path.startsWith('/me/passkeys/') && method === 'DELETE') {
		const id = decodeURIComponent(path.split('/').at(-1)!);
		if (!records.some((item) => item.id === id)) return fail(404, 'NOT_FOUND');
		records = records.filter((item) => item.id !== id);
		return reply(undefined, 204);
	}
	if (path === '/auth/logout-all' && method === 'POST') return reply(undefined, 204);
	return undefined;
}
