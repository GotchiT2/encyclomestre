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
	removePasskey
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
		await savePasskey('secret', 'Téléphone', credential as never, 'captcha');
		expect(apiRequest).toHaveBeenLastCalledWith('/me/passkeys', {
			method: 'POST',
			retryAuth: false,
			body: { password: 'secret', label: 'Téléphone', credential },
			headers: { 'CF-Turnstile-Response': 'captcha' }
		});
		await removePasskey('abc/def');
		expect(apiRequest).toHaveBeenLastCalledWith('/me/passkeys/abc%2Fdef', {
			method: 'DELETE',
			retryAuth: false
		});
	});
});
