import {
	startAuthentication,
	startRegistration,
	WebAuthnAbortService,
	type PublicKeyCredentialCreationOptionsJSON,
	type PublicKeyCredentialRequestOptionsJSON,
	type RegistrationResponseJSON,
	type AuthenticationResponseJSON
} from '@simplewebauthn/browser';
export type {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
	AuthenticationResponseJSON
};
export interface PasskeyDTO {
	id: string;
	label: string;
	synced: boolean;
	createdAt: string;
	lastUsedAt: string;
}
export interface PublicPasskeyOptions {
	requestId: string;
	options: PublicKeyCredentialRequestOptionsJSON;
}
export const cancelPasskey = () => WebAuthnAbortService.cancelCeremony();
export function passkeyAvailable() {
	return (
		typeof window !== 'undefined' &&
		window.isSecureContext &&
		typeof PublicKeyCredential !== 'undefined'
	);
}
export function assertPasskeyAvailable() {
	if (!passkeyAvailable())
		throw new Error(
			typeof window !== 'undefined' && !window.isSecureContext
				? 'passkeys.errors.insecure'
				: 'passkeys.errors.unsupported'
		);
}
export async function authenticatePasskey(optionsJSON: PublicKeyCredentialRequestOptionsJSON) {
	assertPasskeyAvailable();
	return startAuthentication({ optionsJSON });
}
export async function registerPasskey(optionsJSON: PublicKeyCredentialCreationOptionsJSON) {
	assertPasskeyAvailable();
	return startRegistration({ optionsJSON });
}
export function passkeyErrorKey(cause: unknown) {
	const error = cause as {
		name?: string;
		cause?: { name?: string };
		message?: string;
		payload?: { error?: string };
		code?: string;
	};
	const code = error?.payload?.error;
	const name = error?.cause?.name ?? error?.name;
	if (
		[
			'CAPTCHA_FAILED',
			'INVALID_CREDENTIALS',
			'PASSKEY_REJECTED',
			'PASSKEY_CONFLICT',
			'ALREADY_EXISTS',
			'FORBIDDEN_NAME',
			'INVALID_PARAMETER',
			'name_taken',
			'invalid_grant'
		].includes(code ?? '')
	)
		return `passkeys.errors.${code}`;
	if (error?.message?.startsWith('passkeys.')) return error.message;
	if (
		name === 'NotAllowedError' ||
		name === 'AbortError' ||
		error?.code === 'ERROR_CEREMONY_ABORTED'
	)
		return 'passkeys.errors.cancelled';
	if (name === 'SecurityError' || error?.code === 'ERROR_INVALID_RP_ID')
		return 'passkeys.errors.origin';
	if (name === 'InvalidStateError') return 'passkeys.errors.PASSKEY_CONFLICT';
	if ((error as { status?: number })?.status === 401) return 'passkeys.errors.sessionExpired';
	if ((error as { status?: number })?.status === 403) return 'passkeys.errors.denied';
	return 'passkeys.errors.failed';
}
