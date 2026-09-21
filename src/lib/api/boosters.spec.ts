import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request, variants } = vi.hoisted(() => ({
	request: vi.fn(),
	variants: [{ id: 2, name: 'Chrome', color: '#b1cff2', styles: ['CHROME'], renderKey: 'chrome' }]
}));
vi.mock('./client', () => ({ apiRequest: request }));
vi.mock('./variants', async (importOriginal) => ({
	...(await importOriginal<typeof import('./variants')>()),
	getVariants: vi.fn().mockResolvedValue(variants)
}));

import {
	getBoosters,
	getPackDetails,
	getPacks,
	mergePackCatalogue,
	openBooster,
	openAllBoosters,
	resetPackDetailsCache,
	resolvePackDefinition
} from './boosters';

describe('booster API', () => {
	beforeEach(() => {
		request.mockReset();
		resetPackDetailsCache();
	});

	const nebula = {
		id: 3,
		slotId: 3,
		position: 1,
		family: 'PREMIUM_PLUS' as const,
		name: 'nebula',
		description: 'nebula',
		image: 'https://cdn.example.test/nebula.png',
		renderKey: 'nebula',
		status: 'OPEN' as const,
		nbCards: 5,
		openAll: false,
		drawGroups: [
			{ count: 4, variants: [{ variantId: 1, dropRate: 1 }] },
			{
				count: 1,
				variants: [
					{
						variantId: 2,
						dropRate: 0.85,
						maxCopies: 99,
						remainingCopies: 198,
						pages: [
							{ id: 5411, title: 'Soleil', image: '/sun.jpg' },
							{ id: 5958, title: 'Wikipédia' }
						]
					}
				]
			}
		]
	};

	it('maps current slots against shared family credits and achievement bonuses', async () => {
		request.mockResolvedValue({
			families: [{ family: 'PREMIUM', available: 2, max: 3, bonus: 1, nextAvailableAt: null }],
			slots: [
				{
					id: 7,
					name: 'Saisonnier',
					pack: {
						id: 4,
						name: 'Chrome annuel',
						description: 'Cinq cartes',
						image: '/chrome.png',
						family: 'PREMIUM',
						nbCards: 5,
						openAll: false
					}
				},
				{ id: 8, name: 'Terminé' }
			]
		});

		await expect(getBoosters()).resolves.toEqual([
			expect.objectContaining({
				id: 4,
				slotId: 7,
				imageUrl: '/chrome.png',
				regularAvailable: 2,
				bonus: 1,
				available: 3
			})
		]);
		expect(request).toHaveBeenCalledWith('/boosters', { apiTarget: 'wikiforge' });
	});

	it('maps the pack catalogue and preserves decimal rates and aggregate stock', async () => {
		request.mockResolvedValue([nebula]);

		const [pack] = await getPacks();
		expect(request).toHaveBeenCalledWith('/packs', { apiTarget: 'wikiforge' });
		expect(pack.drawGroups[1].variants[0]).toMatchObject({
			dropRate: 0.85,
			maxCopies: 99,
			remainingCopies: 198,
			pages: [
				{ id: 5411, title: 'Soleil', image: '/sun.jpg' },
				{ id: 5958, title: 'Wikipédia' }
			]
		});
		expect(pack).toMatchObject({ imageUrl: 'https://cdn.example.test/nebula.png', status: 'OPEN' });
	});

	it('caches pack details and resolves their variant definitions', async () => {
		request.mockResolvedValue(nebula);

		const first = await getPackDetails(3);
		const second = await getPackDetails(3);
		expect(first).toBe(second);
		expect(request).toHaveBeenCalledTimes(1);
		expect(resolvePackDefinition(first, variants).drawGroups[1].variants[0].variant).toEqual(
			variants[0]
		);
	});

	it('merges user credits by pack without making upcoming packs openable', () => {
		const upcoming = { ...nebula, id: 4, status: 'UPCOMING' as const };
		const credits = [
			{
				id: 3,
				slotId: 3,
				family: 'PREMIUM_PLUS' as const,
				name: 'Nébuleuse',
				description: '',
				imageUrl: '/images/booster.png',
				nbCards: 5,
				regularAvailable: 0,
				bonus: 0,
				available: 0,
				max: 3,
				nextAvailableAt: null
			}
		];

		expect(mergePackCatalogue([nebula, upcoming], credits)).toMatchObject([
			{ id: 3, credit: { available: 0 } },
			{ id: 4, credit: null }
		]);
	});

	it('opens every available booster through the dedicated endpoint', async () => {
		request.mockResolvedValue({ packId: 4, cards: [] });
		await expect(openAllBoosters(4, 'open-token')).resolves.toEqual({ packId: 4, cards: [] });
		expect(request).toHaveBeenCalledWith('/boosters/4/open-all', {
			apiTarget: 'wikiforge',
			method: 'POST',
			headers: { 'X-Turnstile-Token': 'open-token' }
		});
	});

	it('opens the selected pack and preserves the response order', async () => {
		request.mockResolvedValue({
			packId: 4,
			cards: [
				{ id: 9, pageId: 90, title: 'Première', variantId: 2, packId: 4 },
				{
					id: 3,
					pageId: 30,
					title: 'Spéciale',
					variantId: 2,
					packId: 4,
					serialNumber: 1,
					maxCopies: 10
				}
			]
		});

		const result = await openBooster(4, 'open-token');
		expect(request).toHaveBeenCalledWith('/boosters/4/open', {
			apiTarget: 'wikiforge',
			method: 'POST',
			headers: { 'X-Turnstile-Token': 'open-token' }
		});
		expect(result.cards.map((card) => card.id)).toEqual(['9', '3']);
		expect(result.cards[1]).toMatchObject({ serialNumber: 1, maxCopies: 10 });
	});
});
