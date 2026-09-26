import { describe, expect, it } from 'vitest';
import { filterPackPool, normalizePackSearch } from './pack-pool-search';

describe('pack pool search', () => {
	it('matches titles without depending on accents or case', () => {
		expect(normalizePackSearch('Été À PARIS')).toBe('ete a paris');
		expect(
			filterPackPool(
				[{ title: 'Étoile du Nord' }, { title: 'Soleil' }],
				'etoile',
				(item) => item.title
			)
		).toEqual([{ title: 'Étoile du Nord' }]);
	});

	it('does not suggest the entire pool for an empty query', () => {
		expect(filterPackPool([{ title: 'Soleil' }], '   ', (item) => item.title)).toEqual([]);
	});
});
