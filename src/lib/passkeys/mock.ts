import type { PasskeyDTO } from './webauthn';
interface Reply {
	status: number;
	body?: unknown;
}
let records: PasskeyDTO[] = [];
let registration: { challenge: string; expires: number } | undefined;
const requests = new Map<string, { challenge: string; expires: number }>();
const scenario = () =>
	typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem('wikiforge-passkey-scenario');
const encoded = () =>
	btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
const reply = (body?: unknown, status = 200): Reply => ({ status, body });
const fail = (status: number, error: string) => reply({ error }, status);
function clientChallenge(credential: { response?: { clientDataJSON?: string } }) {
	try {
		const raw = credential.response?.clientDataJSON ?? '';
		return JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/'))).challenge as string;
	} catch {
		return undefined;
	}
}
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
	if (path === '/public/passkeys/options' && method === 'POST') {
		const requestId = encoded(),
			challenge = encoded();
		requests.set(requestId, { challenge, expires: Date.now() + 300000 });
		return reply({
			requestId,
			options: {
				challenge,
				rpId,
				timeout: 60000,
				userVerification: 'required',
				allowCredentials: []
			}
		});
	}
	if (
		path === '/oauth2/token' &&
		method === 'POST' &&
		input?.grant_type === 'urn:wikiforge:grant-type:passkey'
	) {
		const id = String(input.request_id),
			data = requests.get(id);
		requests.delete(id);
		let credential: { id?: string; response?: { clientDataJSON?: string } };
		try {
			credential = JSON.parse(String(input.credential));
		} catch {
			return fail(400, 'invalid_grant');
		}
		if (
			scenario() === 'invalid-grant' ||
			!data ||
			data.expires < Date.now() ||
			clientChallenge(credential) !== data.challenge ||
			!records.some((item) => item.id === credential.id)
		)
			return fail(400, 'invalid_grant');
		const record = records.find((item) => item.id === credential.id)!;
		record.lastUsedAt = new Date().toISOString();
		return reply({
			access_token: 'mock-passkey-token',
			refresh_token: 'mock-passkey-refresh',
			token_type: 'Bearer',
			expires_in: 3600
		});
	}
	if (path === '/me/passkeys' && method === 'GET') {
		if (scenario() === 'limit')
			return reply(
				Array.from({ length: 10 }, (_, i) => ({
					id: `fixture-${i}`,
					label: `Appareil ${i + 1}`,
					synced: true,
					createdAt: new Date().toISOString(),
					lastUsedAt: new Date().toISOString()
				}))
			);
		return reply(scenario() === 'empty' || !records.length ? undefined : records);
	}
	if (path === '/me/passkeys/options' && method === 'POST') {
		if (scenario() === 'limit' || records.length >= 10) return fail(409, 'PASSKEY_CONFLICT');
		registration = { challenge: encoded(), expires: Date.now() + 300000 };
		return reply({
			challenge: registration.challenge,
			rp: { id: rpId, name: 'WikiForge mock' },
			user: { id: 'AQ', name: 'demo@wikiforge.fr', displayName: 'Demo' },
			pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
			authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
			timeout: 60000,
			attestation: 'none',
			excludeCredentials: records.map((item) => ({ id: item.id, type: 'public-key' }))
		});
	}
	if (path === '/me/passkeys' && method === 'POST') {
		if (scenario() === 'captcha' || !new Headers(headers).get('CF-Turnstile-Response'))
			return fail(403, 'CAPTCHA_FAILED');
		if (input?.password !== 'demo-password') return fail(403, 'INVALID_CREDENTIALS');
		const credential = input?.credential as { id: string; response?: { clientDataJSON?: string } };
		if (
			scenario() === 'expired' ||
			!registration ||
			registration.expires < Date.now() ||
			clientChallenge(credential) !== registration.challenge
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
	if (path.startsWith('/me/passkeys/') && method === 'DELETE') {
		const id = decodeURIComponent(path.split('/').at(-1)!);
		if (!records.some((item) => item.id === id)) return fail(404, 'NOT_FOUND');
		records = records.filter((item) => item.id !== id);
		return reply(undefined, 204);
	}
	if (path === '/auth/logout-all' && method === 'POST') return reply(undefined, 204);
	return undefined;
}
