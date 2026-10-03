import { apiRequest } from '$lib/api/client';
import { finalizeOAuthLogin, logoutAll } from '$lib/api/auth';
import { authenticatePasskey } from './webauthn';
import type { OAuth2TokenResponse } from '$lib/types';
import type {
	PasskeyDTO,
	PublicPasskeyOptions,
	PublicKeyCredentialCreationOptionsJSON,
	RegistrationResponseJSON,
	AuthenticationResponseJSON
} from './webauthn';
export const getPasskeys = async () => (await apiRequest<PasskeyDTO[]>('/me/passkeys')) ?? [];
export const getRegistrationOptions = () =>
	apiRequest<PublicKeyCredentialCreationOptionsJSON>('/me/passkeys/options', {
		method: 'POST',
		retryAuth: false
	});
export const savePasskey = (
	label: string,
	credential: RegistrationResponseJSON,
	reauth: Reauthentication
) =>
	apiRequest<PasskeyDTO>('/me/passkeys', {
		method: 'POST',
		body: { label, credential, reauth },
		retryAuth: false
	});
export const removePasskey = (id: string) =>
	apiRequest<void>(`/me/passkeys/${encodeURIComponent(id)}`, {
		method: 'DELETE',
		retryAuth: false
	});
export const getAuthenticationOptions = (signal?: AbortSignal) =>
	apiRequest<PublicPasskeyOptions>('/public/passkeys/options', {
		method: 'POST',
		skipAuth: true,
		signal
	});
export type Reauthentication =
	{ recoveryCode: string } | { requestId: string; credential: AuthenticationResponseJSON };
export async function getReauthentication(recoveryCode = ''): Promise<Reauthentication> {
	if (recoveryCode.trim()) return { recoveryCode: recoveryCode.trim() };
	const ceremony = await apiRequest<PublicPasskeyOptions>('/me/reauth/options', {
		method: 'POST',
		retryAuth: false
	});
	return { requestId: ceremony.requestId, credential: await authenticatePasskey(ceremony.options) };
}
export const regenerateRecoveryCodes = (reauth: Reauthentication) =>
	apiRequest<{ codes: string[] }>('/me/recovery-codes', {
		method: 'POST',
		body: reauth,
		retryAuth: false
	});
export const getSignupOptions = (name: string, token: string) =>
	apiRequest<{ requestId: string; options: PublicKeyCredentialCreationOptionsJSON }>(
		'/public/passkeys/signup/options',
		{
			method: 'POST',
			body: { name },
			headers: { 'CF-Turnstile-Response': token },
			skipAuth: true,
			retryAuth: false
		}
	);
export const getRecoveryOptions = (
	input: { name: string; code: string } | { token: string },
	captcha?: string
) =>
	apiRequest<{ requestId: string; options: PublicKeyCredentialCreationOptionsJSON }>(
		'/public/passkeys/recovery/options',
		{
			method: 'POST',
			body: input,
			...(captcha ? { headers: { 'CF-Turnstile-Response': captcha } } : {}),
			skipAuth: true,
			retryAuth: false
		}
	);
export class PasskeyFinalizationError extends Error {
	constructor(public tokens: OAuth2TokenResponse) {
		super('passkeys.errors.finalize');
	}
}
export async function finishPasskeyCeremony(
	requestId: string,
	credential: AuthenticationResponseJSON | RegistrationResponseJSON,
	signal?: AbortSignal
) {
	const tokens = await apiRequest<OAuth2TokenResponse>('/oauth2/token', {
		method: 'POST',
		skipAuth: true,
		retryAuth: false,
		signal,
		body: new URLSearchParams({
			grant_type: 'urn:wikiforge:grant-type:passkey',
			request_id: requestId,
			credential: JSON.stringify(credential)
		})
	});
	try {
		return {
			session: await finalizeOAuthLogin(tokens, { signal }),
			recoveryCodes: tokens.recovery_codes ?? []
		};
	} catch {
		throw new PasskeyFinalizationError(tokens);
	}
}
export async function finishPasskeyLogin(
	requestId: string,
	credential: AuthenticationResponseJSON,
	signal?: AbortSignal
) {
	return (await finishPasskeyCeremony(requestId, credential, signal)).session;
}
export const logoutPasskeySessions = logoutAll;

export { isMockApiEnabled as isPasskeyMock } from '$lib/api/client';
