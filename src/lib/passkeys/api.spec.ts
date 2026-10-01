import { beforeEach, describe, expect, it, vi } from 'vitest';
const { apiRequest, finalizeOAuthLogin } = vi.hoisted(() => ({
	apiRequest: vi.fn(),
	finalizeOAuthLogin: vi.fn()
}));
vi.mock('$lib/api/client', () => ({ apiRequest, isMockApiEnabled: () => false }));
vi.mock('$lib/api/auth', () => ({ finalizeOAuthLogin, logoutAll: vi.fn() }));
import {
	getAuthenticationOptions,
	finishPasskeyLogin,
	getPasskeys,
	getRegistrationOptions,
	savePasskey,
	removePasskey,
	getSignupOptions,
	getRecoveryOptions,
	regenerateRecoveryCodes,
	finishPasskeyCeremony,
	PasskeyFinalizationError
} from './api';
const credential = {
	id: 'abc',
	rawId: 'abc',
	type: 'public-key',
	response: {},
	clientExtensionResults: {}
};
describe('contrats passkey FO', () => {
	beforeEach(() => {
		apiRequest.mockReset();
		finalizeOAuthLogin.mockReset();
	});
	it('requires CAPTCHA for signup and code recovery, while link recovery uses only its token', async () => {
		await getSignupOptions('Collector', 'captcha');
		expect(apiRequest).toHaveBeenLastCalledWith(
			'/public/passkeys/signup/options',
			expect.objectContaining({
				body: { name: 'Collector' },
				headers: { 'CF-Turnstile-Response': 'captcha' },
				skipAuth: true,
				retryAuth: false
			})
		);
		await getRecoveryOptions({ name: 'Collector', code: 'backup-code' }, 'captcha');
		expect(apiRequest).toHaveBeenLastCalledWith(
			'/public/passkeys/recovery/options',
			expect.objectContaining({
				headers: { 'CF-Turnstile-Response': 'captcha' },
				body: { name: 'Collector', code: 'backup-code' }
			})
		);
		await getRecoveryOptions({ token: 'recovery-link' });
		expect(apiRequest.mock.calls.at(-1)![1]).not.toHaveProperty('headers');
	});
	it('keeps one-time codes available when profile finalization fails without replaying the ceremony', async () => {
		const tokens = { access_token: 'new-access', recovery_codes: ['one-time-code'] };
		apiRequest.mockResolvedValue(tokens);
		finalizeOAuthLogin.mockRejectedValue(new Error('network'));
		const failure = await finishPasskeyCeremony('ceremony', credential as never).catch(
			(error) => error
		);
		expect(failure).toBeInstanceOf(PasskeyFinalizationError);
		expect(failure.tokens).toEqual(tokens);
		expect(apiRequest).toHaveBeenCalledOnce();
	});
	it('sends backup-code reauthentication directly for code regeneration', async () => {
		await regenerateRecoveryCodes({ recoveryCode: 'backup-code' });
		expect(apiRequest).toHaveBeenLastCalledWith('/me/recovery-codes', {
			method: 'POST',
			body: { recoveryCode: 'backup-code' },
			retryAuth: false
		});
	});
	it('appelle les options sans authentification puis le grant OAuth sans CAPTCHA', async () => {
		await getAuthenticationOptions();
		expect(apiRequest).toHaveBeenLastCalledWith(
			'/public/passkeys/options',
			expect.objectContaining({ method: 'POST', skipAuth: true })
		);
		apiRequest.mockResolvedValue({ access_token: 'access' });
		await finishPasskeyLogin('request', credential as never);
		const options = apiRequest.mock.calls.at(-1)![1];
		expect(options.skipAuth).toBe(true);
		expect(options.body.get('grant_type')).toBe('urn:wikiforge:grant-type:passkey');
		expect(options.body.get('request_id')).toBe('request');
		expect(JSON.parse(options.body.get('credential'))).toEqual(credential);
		expect(options.body.has('cf-turnstile-response')).toBe(false);
		expect(finalizeOAuthLogin).toHaveBeenCalledWith({ access_token: 'access' }, expect.anything());
	});
	it('normalise la liste omise et interdit le rejeu des challenges et écritures', async () => {
		apiRequest.mockResolvedValue(undefined);
		expect(await getPasskeys()).toEqual([]);
		await getRegistrationOptions();
		expect(apiRequest.mock.calls.at(-1)![1].retryAuth).toBe(false);
		await savePasskey('Téléphone', credential as never, { recoveryCode: 'secret' });
		expect(apiRequest).toHaveBeenLastCalledWith('/me/passkeys', {
			method: 'POST',
			retryAuth: false,
			body: { reauth: { recoveryCode: 'secret' }, label: 'Téléphone', credential }
		});
		await removePasskey('abc/def');
		expect(apiRequest).toHaveBeenLastCalledWith('/me/passkeys/abc%2Fdef', {
			method: 'DELETE',
			retryAuth: false
		});
	});
});
