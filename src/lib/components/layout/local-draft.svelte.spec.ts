import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
import { currentSession } from '$lib/auth/session';
import type { AuthSession } from '$lib/types';
import { draftKey, readDraft, writeDraft } from '$lib/drafts/storage';
import LocalDraft from './local-draft.svelte';
vi.mock('$lib/api/public-env', () => ({ env: {} }));
const session = { accessToken: 'mock-only', user: { id: 'draft-test' } } as AuthSession;
describe('Local draft consent and restoration', () => {
	it('does not save until enabled and removes storage when disabled', async () => {
		localStorage.clear();
		currentSession.set(session);
		render(LocalDraft, { props: { target: 'message:2', value: 'Texte', onRestore: vi.fn() } });
		expect(readDraft(localStorage, draftKey('draft-test', 'message:2'))).toBeNull();
		await page.getByRole('checkbox').click();
		await expect
			.poll(() => readDraft(localStorage, draftKey('draft-test', 'message:2')))
			.toBe('Texte');
		await page.getByRole('checkbox').click();
		await expect
			.poll(() => readDraft(localStorage, draftKey('draft-test', 'message:2')))
			.toBeNull();
	});
	it('requires confirmation before replacing current text', async () => {
		localStorage.clear();
		currentSession.set(session);
		writeDraft(localStorage, draftKey('draft-test', 'message:2'), 'Ancien');
		const restore = vi.fn();
		render(LocalDraft, { props: { target: 'message:2', value: 'Actuel', onRestore: restore } });
		await page.getByRole('button', { name: 'Restaurer le brouillon enregistré' }).click();
		expect(restore).not.toHaveBeenCalled();
		await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
		expect(restore).toHaveBeenCalledWith('Ancien');
	});
});
