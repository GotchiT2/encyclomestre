import { apiRequest } from '$lib/api/client';
import { finalizeOAuthLogin, logoutAll } from '$lib/api/auth';
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
	password: string,
	label: string,
	credential: RegistrationResponseJSON,
	token: string
) =>
	apiRequest<PasskeyDTO>('/me/passkeys', {
		method: 'POST',
		body: { password, label, credential },
		headers: { 'CF-Turnstile-Response': token },
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
export async function finishPasskeyLogin(
	requestId: string,
	credential: AuthenticationResponseJSON,
	signal?: AbortSignal
) {
	const tokens = await apiRequest<OAuth2TokenResponse>('/oauth2/token', {
		method: 'POST',
		skipAuth: true,
		signal,
		body: new URLSearchParams({
			grant_type: 'urn:wikiforge:grant-type:passkey',
			request_id: requestId,
			credential: JSON.stringify(credential)
		})
	});
	return finalizeOAuthLogin(tokens, { signal });
}
export const logoutPasskeySessions = logoutAll;

export { isMockApiEnabled as isPasskeyMock } from '$lib/api/client';
