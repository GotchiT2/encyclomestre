import { describe, expect, it, vi, afterEach } from 'vitest';
import { passkeyMock } from './mock';
import { passkeyErrorKey } from './webauthn';
afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});
describe('enregistrement passkey et défis à usage unique', () => {
	it('refuse un défi après cinq minutes', () => {
		vi.useFakeTimers();
		const options = passkeyMock('/me/passkeys/options', 'POST')!.body as { challenge: string };
		vi.advanceTimersByTime(300001);
		const credential = {
			id: 'expired',
			response: { clientDataJSON: btoa(JSON.stringify({ challenge: options.challenge })) }
		};
		expect(
			passkeyMock(
				'/me/passkeys',
				'POST',
				{ label: 'Expired', password: 'demo-password', credential },
				{ 'CF-Turnstile-Response': 'token' }
			)!.body
		).toEqual({ error: 'PASSKEY_REJECTED' });
	});

	it('garde les options après un mauvais mot de passe et consomme le défi après succès', () => {
		const options = passkeyMock('/me/passkeys/options', 'POST')!.body as { challenge: string };
		const credential = {
			id: 'credential-test',
			response: { clientDataJSON: btoa(JSON.stringify({ challenge: options.challenge })) }
		};
		const input = { label: 'Phone', password: 'wrong', credential };
		expect(
			passkeyMock('/me/passkeys', 'POST', input, { 'CF-Turnstile-Response': 'token' })!.status
		).toBe(403);
		const saved = passkeyMock(
			'/me/passkeys',
			'POST',
			{ ...input, password: 'demo-password' },
			{ 'CF-Turnstile-Response': 'new-token' }
		)!;
		expect(saved.status).toBe(201);
		expect(
			passkeyMock(
				'/me/passkeys',
				'POST',
				{ ...input, password: 'demo-password' },
				{ 'CF-Turnstile-Response': 'new-token' }
			)!.body
		).toEqual({ error: 'PASSKEY_REJECTED' });
		const request = passkeyMock('/public/passkeys/options', 'POST')!.body as {
			requestId: string;
			options: { challenge: string };
		};
		const assertion = {
			id: credential.id,
			response: { clientDataJSON: btoa(JSON.stringify({ challenge: request.options.challenge })) }
		};
		const form = new URLSearchParams({
			grant_type: 'urn:wikiforge:grant-type:passkey',
			request_id: request.requestId,
			credential: JSON.stringify(assertion)
		});
		expect(passkeyMock('/oauth2/token', 'POST', form)!.status).toBe(200);
		expect(passkeyMock('/oauth2/token', 'POST', form)!.body).toEqual({ error: 'invalid_grant' });
		expect(passkeyMock('/me/passkeys/credential-test', 'DELETE')!.status).toBe(204);
	});
	it('traduit les refus du contrat et les annulations sans détails bruts', () => {
		expect(passkeyErrorKey({ payload: { error: 'invalid_grant' } })).toBe(
			'passkeys.errors.invalid_grant'
		);
		expect(passkeyErrorKey({ name: 'NotAllowedError' })).toBe('passkeys.errors.cancelled');
		expect(passkeyErrorKey({ status: 401 })).toBe('passkeys.errors.sessionExpired');
		expect(passkeyErrorKey({ name: 'WebAuthnError', cause: { name: 'NotAllowedError' } })).toBe(
			'passkeys.errors.cancelled'
		);
		expect(passkeyErrorKey({ payload: { error: 'INVALID_CREDENTIALS' } })).toBe(
			'passkeys.errors.INVALID_CREDENTIALS'
		);
	});
});
