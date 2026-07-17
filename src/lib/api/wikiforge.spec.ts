import { describe, expect, it } from 'vitest';
import { toCardPage, toCollectionCardRecord } from './wikiforge';

describe('WikiForge API adapters', () => {
	it('préserve les identifiants catalogue et exemplaire d’une carte de collection', () => {
		const card = toCollectionCardRecord({
			userCardId: 'user-card-uuid',
			cardId: 'variant-uuid',
			acquiredAt: '2026-07-14T12:00:00Z',
			tags: [{ id: 'tag-1', name: 'Favori', color: '#feb823' }],
			card: {
				id: 'variant-uuid',
				baseCardId: 42,
				variant: 'FULL_ART',
				wikipediaTitle: 'Carte de validation',
				shortDescription: 'Description courte',
				longDescription: 'Description complète',
				imageUrl: '/card-placeholder.svg',
				rarity: 'L',
				isFullArt: true,
				atk: 1200,
				def: 900
			},
			activeSale: {
				id: 'sale-uuid',
				type: 'auction',
				status: 'active',
				price: 10,
				currentPrice: 10,
				minimumBid: 11,
				endsAt: '2026-07-18T00:00:00Z'
			}
		});

		expect(card).toMatchObject({
			id: 'user-card-uuid',
			catalogueId: 'variant-uuid',
			title: 'Carte de validation',
			longDescription: 'Description complète',
			isFullArt: true,
			attack: 1200,
			defense: 900,
			collectionTags: [{ id: 'tag-1' }],
			activeSale: { id: 'sale-uuid', minimumBid: 11 }
		});
	});

	it('convertit la pagination API indexée à zéro pour l’interface', () => {
		const page = toCardPage({
			results: [
				{
					id: 'normal-uuid',
					baseCardId: 7,
					variant: 'NORMAL',
					isFullArt: false,
					wikipediaTitle: 'Carte publique',
					imageUrl: '/card-placeholder.svg',
					rarity: 'UNKNOWN'
				}
			],
			page: 1,
			nbResults: 45,
			size: 20
		});

		expect(page.meta).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 });
		expect(page.items[0]).toMatchObject({ rarity: 'Commune', rarityInitials: 'C' });
	});
});
