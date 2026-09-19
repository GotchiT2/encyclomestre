import { describe, expect, it } from 'vitest';
import { buildCollectionFilterTarget, effectiveCollectionQuery } from './collection-filter-url';

describe('collection filter URL', () => {
	it('keeps the default URL stable and never serializes pagination state', () => {
		expect(
			buildCollectionFilterTarget({
				query: '',
				sortBy: 'acquiredDate',
				variantIds: [],
				tagFilterIds: [],
				duplicate: 'all',
				protected: 'all'
			})
		).toBe('/collection');
	});

	it('serializes only supported filters', () => {
		expect(
			buildCollectionFilterTarget({
				query: '  test  ',
				sortBy: 'name',
				variantIds: [4, 7],
				tagFilterIds: ['2', '7'],
				duplicate: 'yes',
				protected: 'no'
			})
		).toBe('/collection?q=test&sortBy=name&variant=4&variant=7&tag=2&tag=7&duplicate=yes&protected=no');
	});

	it('treats one or two non-blank characters as no search', () => {
		expect(effectiveCollectionQuery('')).toBeUndefined();
		expect(effectiveCollectionQuery(' a ')).toBeUndefined();
		expect(effectiveCollectionQuery(' ab ')).toBeUndefined();
		expect(effectiveCollectionQuery(' abc ')).toBe('abc');
	});
});
