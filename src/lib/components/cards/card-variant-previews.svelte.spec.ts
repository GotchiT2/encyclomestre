import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import '$lib/i18n';
import { mockCards } from '$lib/api/mocks/cards';
import CardVariantPreviews from './card-variant-previews.svelte';
const { read } = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('$lib/api/public-env', () => ({ env: {} }));
vi.mock('$lib/api/pages', () => ({
	getWikiForgePublicPage: read,
	toPublicPageCardRecord: () => mockCards[0]
}));
const record = {
	id: 10,
	title: 'Carte',
	atk: 1,
	globalCount: 1,
	variantIds: [1, 2],
	_variants: [
		{ id: 1, name: 'Normal', color: '#ffffff', styles: ['NORMAL'], renderKey: 'standard' },
		{ id: 2, name: 'Chrome', color: '#ffffff', styles: ['CHROME'], renderKey: 'chrome' }
	]
};
describe('Card variant reads', () => {
	it('reads by page ID once and does not reload after updating the card copy', async () => {
		read.mockReset().mockResolvedValue(record);
		const card = { ...mockCards[0], id: '777', baseCardId: 10 };
		const view = render(CardVariantPreviews, { card });
		await expect.element(page.getByText('Comparer deux variantes')).toBeVisible();
		expect(read).toHaveBeenCalledExactlyOnceWith(10);
		await view.rerender({ card: { ...card, ownedCount: 42 } });
		expect(read).toHaveBeenCalledTimes(1);
	});
	it('shows an isolated retry instead of leaving a loading state', async () => {
		read.mockReset().mockRejectedValue(new Error('offline'));
		render(CardVariantPreviews, { card: { ...mockCards[0], baseCardId: 10 } });
		await expect.element(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
		read.mockResolvedValue(record);
		await page.getByRole('button', { name: 'Réessayer' }).click();
		await expect.element(page.getByText('Comparer deux variantes')).toBeVisible();
	});
});
