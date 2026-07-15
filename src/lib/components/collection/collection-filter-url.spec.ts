import { describe, expect, it } from 'vitest';
import { buildCollectionFilterTarget, untaggedFilterId } from './collection-filter-url';

describe('buildCollectionFilterTarget', () => {
	it('keeps the initial collection URL stable with default filters', () => {
		expect(
			buildCollectionFilterTarget({
				query: '',
				sortBy: 'rarity',
				selectedRarities: [],
				tagFilterIds: []
			})
		).toBe('/collection');
	});

	it('serializes only active filters', () => {
		expect(
			buildCollectionFilterTarget({
				query: '  test  ',
				sortBy: 'name',
				selectedRarities: ['Rare'],
				tagFilterIds: ['tag-1', untaggedFilterId]
			})
		).toBe('/collection?q=test&sortBy=name&rarity=Rare&tag=tag-1&untagged=true');
	});
});
