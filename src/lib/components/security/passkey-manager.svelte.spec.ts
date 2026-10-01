import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
const mocks = vi.hoisted(() => ({
	getPasskeys: vi.fn(),
	getRegistrationOptions: vi.fn(),
	savePasskey: vi.fn(),
	getReauthentication: vi.fn(),
	regenerateRecoveryCodes: vi.fn(),
	registerPasskey: vi.fn()
}));
vi.mock('$lib/passkeys/api', () => ({ ...mocks, removePasskey: vi.fn() }));
vi.mock('$lib/api/users', () => ({ getCurrentUser: vi.fn().mockResolvedValue({ id: '1' }) }));
vi.mock('$lib/passkeys/webauthn', async (original) => ({
	...(await original<typeof import('$lib/passkeys/webauthn')>()),
	registerPasskey: mocks.registerPasskey,
	passkeyAvailable: () => true,
	cancelPasskey: vi.fn()
}));
import Manager from './passkey-manager.svelte';
describe('ajout de passkey après revérification', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getPasskeys.mockResolvedValue([]);
		mocks.getReauthentication.mockResolvedValue({ recoveryCode: 'valid' });
		mocks.getRegistrationOptions.mockResolvedValue({ challenge: 'challenge' });
		mocks.registerPasskey.mockResolvedValue({ id: 'credential' });
		mocks.savePasskey.mockResolvedValue({ id: 'credential' });
	});
	it('arrête le parcours si la revérification échoue et permet une nouvelle tentative', async () => {
		mocks.getReauthentication.mockRejectedValueOnce({ payload: { error: 'INVALID_CREDENTIALS' } });
		render(Manager, { onLogoutAll: vi.fn() });
		await page.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		const dialog = page.getByRole('dialog');
		await page.getByLabelText('Nom de la passkey').fill('Téléphone');
		await dialog.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		await expect.element(dialog.getByRole('alert')).toHaveTextContent('vérification');
		expect(mocks.getRegistrationOptions).not.toHaveBeenCalled();
		await dialog.getByRole('button', { name: 'Ajouter une passkey', exact: true }).click();
		await expect.element(page.getByText('Passkey enregistrée.', { exact: true })).toBeVisible();
		expect(mocks.getRegistrationOptions).toHaveBeenCalledTimes(1);
		expect(mocks.savePasskey).toHaveBeenCalledWith(
			'Téléphone',
			{ id: 'credential' },
			{ recoveryCode: 'valid' }
		);
	});
});
