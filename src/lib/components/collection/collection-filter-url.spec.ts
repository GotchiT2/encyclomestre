import { describe, expect, it } from 'vitest';
import { buildCollectionFilterTarget, untaggedFilterId } from './collection-filter-url';

describe('buildCollectionFilterTarget', () => {
	it('keeps the initial collection URL stable with default filters', () => {
		expect(
			buildCollectionFilterTarget({
				query: '',
				sortBy: 'rarity',
				selectedRarities: [],
				tagFilterIds: [],
				variant: 'all',
				saleState: 'ALL'
			})
		).toBe('/collection');
	});

	it('serializes only active filters', () => {
		expect(
			buildCollectionFilterTarget({
				query: '  test  ',
				sortBy: 'name',
				selectedRarities: ['Rare'],
				tagFilterIds: ['tag-1', untaggedFilterId],
				variant: 'alternative',
				saleState: 'ACTIVE'
			})
		).toBe(
			'/collection?q=test&sortBy=name&rarity=Rare&tag=tag-1&untagged=true&variant=alternative&saleState=ACTIVE'
		);
	});

	it('keeps the response page and next cursor for collection navigation', () => {
		expect(
			buildCollectionFilterTarget({
				query: '',
				sortBy: 'rarity',
				selectedRarities: [],
				tagFilterIds: [],
				variant: 'all',
				saleState: 'ALL',
				page: 2,
				cursor: 'cursor-value'
			})
		).toBe('/collection?page=2&cursor=cursor-value');
	});
});
