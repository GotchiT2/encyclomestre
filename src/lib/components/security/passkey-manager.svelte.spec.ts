import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { addMessages, init } from 'svelte-i18n';
import fr from '$lib/locales/fr.json';
import type { TurnstileRenderOptions } from '$lib/security/turnstile';

const mocks = vi.hoisted(() => ({
	getPasskeys: vi.fn(),
	getRegistrationOptions: vi.fn(),
	savePasskey: vi.fn(),
	registerPasskey: vi.fn(),
	reset: vi.fn(),
	render: vi.fn(),
	execute: vi.fn()
}));
vi.mock('$lib/passkeys/api', () => ({
	...mocks,
	removePasskey: vi.fn(),
	isPasskeyMock: () => false
}));
vi.mock('$lib/passkeys/webauthn', async (original) => ({
	...(await original<typeof import('$lib/passkeys/webauthn')>()),
	registerPasskey: mocks.registerPasskey,
	passkeyAvailable: () => true,
	cancelPasskey: vi.fn()
}));
vi.mock('$lib/security/turnstile', () => ({
	TURNSTILE_SITE_KEY: 'test',
	loadTurnstile: async () => ({
		render: mocks.render,
		execute: mocks.execute,
		reset: mocks.reset,
		remove: vi.fn()
	})
}));
import Manager from './passkey-manager.svelte';

describe('ajout de passkey avec Turnstile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		addMessages('fr', fr);
		init({ fallbackLocale: 'fr', initialLocale: 'fr' });
		mocks.getPasskeys.mockResolvedValue([]);
		mocks.getRegistrationOptions.mockResolvedValue({ challenge: 'challenge' });
		mocks.registerPasskey.mockResolvedValue({ id: 'credential' });
	});
	it('renouvelle le CAPTCHA mais conserve la réponse WebAuthn après un mot de passe refusé', async () => {
		let options: TurnstileRenderOptions;
		mocks.render.mockImplementation((_container, config) => {
			options = config;
			return 'widget';
		});
		mocks.execute.mockImplementation(() =>
			options.callback(`token-${mocks.execute.mock.calls.length}`)
		);
		mocks.savePasskey
			.mockRejectedValueOnce({ payload: { error: 'INVALID_CREDENTIALS' } })
			.mockResolvedValueOnce({ id: 'credential' });
		render(Manager, { onLogoutAll: vi.fn() });
		await page.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		const dialog = page.getByRole('dialog');
		await page.getByLabelText('Nom de la passkey').fill('Téléphone');
		await page.getByLabelText('Mot de passe actuel').fill('wrong');
		await dialog.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('Mot de passe incorrect');
		expect(options!.action).toBe('passkey');
		await page.getByLabelText('Mot de passe actuel').fill('correct');
		await dialog.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		await expect.element(page.getByText('Passkey enregistrée.', { exact: true })).toBeVisible();
		expect(mocks.getRegistrationOptions).toHaveBeenCalledTimes(1);
		expect(mocks.registerPasskey).toHaveBeenCalledTimes(1);
		expect(mocks.savePasskey.mock.calls.map((args) => args[3])).toEqual(['token-1', 'token-2']);
		expect(mocks.reset.mock.calls.length).toBeGreaterThanOrEqual(4);
	});
});
