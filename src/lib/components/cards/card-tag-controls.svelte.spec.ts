import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import { mockCards } from '$lib/api/mocks/cards';
import { currentSession } from '$lib/auth/session';
import {
	addWikiForgeCardTag,
	createWikiForgeTag,
	getWikiForgeCollectionCard,
	getWikiForgeTags
} from '$lib/api';
import CardTagControls from './card-tag-controls.svelte';

vi.mock('$lib/api', () => ({
	addWikiForgeCardTag: vi.fn(),
	removeWikiForgeCardTag: vi.fn(),
	createWikiForgeTag: vi.fn(),
	getWikiForgeTags: vi.fn(),
	getWikiForgeCollectionCard: vi.fn()
}));
vi.mock('$lib/realtime/resource-refresh', () => ({ publishRealtimeRefresh: vi.fn() }));
const tag = { id: 'tag-new', name: 'À échanger', color: '#E8EF42', visibility: 'FRIENDS' as const };
const card = { ...mockCards[0], id: 'card-test', collectionTagIds: [] as string[] };
beforeEach(() => {
	vi.resetAllMocks();
	currentSession.set({
		accessToken: 'mock',
		user: {
			id: '1',
			username: 'Demo',
			displayName: 'Demo',
			role: 'user',
			createdAt: '',
			updatedAt: ''
		}
	});
	vi.mocked(createWikiForgeTag).mockResolvedValue(tag);
	vi.mocked(getWikiForgeTags).mockResolvedValue([tag]);
	vi.mocked(addWikiForgeCardTag).mockResolvedValue({ ...card, collectionTagIds: [tag.id] });
	vi.mocked(getWikiForgeCollectionCard).mockResolvedValue(card);
});
afterEach(() => currentSession.set(null));
async function enter(name: string) {
	await page.getByRole('searchbox').fill(name);
	page
		.getByRole('searchbox')
		.element()
		.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}
describe('create and assign tags in a personal inspection', () => {
	it('keeps a pending creation locked through a balance refresh and rejects duplicate validation', async () => {
		const pending = Promise.withResolvers<typeof tag>();
		vi.mocked(createWikiForgeTag).mockReturnValue(pending.promise);
		render(CardTagControls, { cardId: card.id, tags: [], assignments: {} });
		await enter(tag.name);
		await expect.element(page.getByRole('searchbox')).toBeDisabled();
		currentSession.update(
			(session) => session && { ...session, user: { ...session.user, money: 400 } }
		);
		await expect.element(page.getByRole('searchbox')).toBeDisabled();
		page
			.getByRole('searchbox')
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		pending.resolve(tag);
		await expect.element(page.getByRole('searchbox')).toHaveValue('');
		expect(createWikiForgeTag).toHaveBeenCalledOnce();
		expect(addWikiForgeCardTag).toHaveBeenCalledOnce();
	});
	it('trims the name and creates FRIENDS/yellow before assigning once', async () => {
		render(CardTagControls, { cardId: card.id, tags: [], assignments: {} });
		await enter('  À échanger  ');
		await expect.poll(() => vi.mocked(addWikiForgeCardTag).mock.calls.length).toBe(1);
		expect(createWikiForgeTag).toHaveBeenCalledExactlyOnceWith({
			name: 'À échanger',
			color: '#E8EF42',
			visibility: 'FRIENDS'
		});
		expect(addWikiForgeCardTag).toHaveBeenCalledExactlyOnceWith(card.id, tag.id);
		await expect.element(page.getByRole('searchbox')).toHaveValue('');
	});
	it('reuses an existing name ignoring case, without creating a duplicate', async () => {
		render(CardTagControls, { cardId: card.id, tags: [tag], assignments: {} });
		await enter('à ÉCHANGER');
		await expect.poll(() => vi.mocked(addWikiForgeCardTag).mock.calls.length).toBe(1);
		expect(createWikiForgeTag).not.toHaveBeenCalled();
	});
	it('retains the created tag and input after a partial failure, then only retries assignment', async () => {
		vi.mocked(addWikiForgeCardTag).mockRejectedValueOnce(new Error('assignment failed'));
		render(CardTagControls, { cardId: card.id, tags: [], assignments: {} });
		await enter(tag.name);
		await expect.element(page.getByRole('alert')).toBeVisible();
		await expect.element(page.getByRole('searchbox')).toHaveValue(tag.name);
		await enter(tag.name);
		await expect.element(page.getByRole('searchbox')).toHaveValue('');
		expect(createWikiForgeTag).toHaveBeenCalledOnce();
		expect(addWikiForgeCardTag).toHaveBeenCalledTimes(2);
	});
	it('reconciles an uncertain successful assignment without a second write', async () => {
		vi.mocked(addWikiForgeCardTag).mockRejectedValueOnce(new Error('network timeout'));
		vi.mocked(getWikiForgeCollectionCard).mockResolvedValue({
			...card,
			collectionTagIds: [tag.id]
		});
		render(CardTagControls, { cardId: card.id, tags: [tag], assignments: {} });
		await enter(tag.name);
		await expect.poll(() => vi.mocked(getWikiForgeCollectionCard).mock.calls.length).toBe(1);
		await expect.element(page.getByRole('searchbox')).toHaveValue('');
		expect(addWikiForgeCardTag).toHaveBeenCalledOnce();
	});
	it('rereads an uncertain creation before retrying, preserving the input and avoiding a duplicate POST', async () => {
		vi.mocked(createWikiForgeTag).mockRejectedValueOnce(new Error('network timeout'));
		render(CardTagControls, { cardId: card.id, tags: [], assignments: {} });
		await enter(tag.name);
		await expect.element(page.getByRole('alert')).toBeVisible();
		expect(getWikiForgeTags).toHaveBeenCalledOnce();
		await enter(tag.name);
		await expect.element(page.getByRole('searchbox')).toHaveValue('');
		expect(createWikiForgeTag).toHaveBeenCalledOnce();
		expect(addWikiForgeCardTag).toHaveBeenCalledOnce();
	});
});
