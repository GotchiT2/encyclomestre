import { describe, expect, it } from 'vitest';
import { collectionPath, nextCollectionPosition } from './collection';

describe('collection variants and pagination', () => {
	it('repeats variant filters and never emits rarity sorting', () => {
		const path = collectionPath({ sortBy: 'name', variantIds: [4, 7], query: ' Rose ' });
		expect(path).toContain('sortBy=NAME');
		expect(path).toContain('variant=4&variant=7');
		expect(path).not.toContain('rarity');
	});

	it('uses cursor pagination only for acquired date without a search', () => {
		expect(collectionPath({ cursor: 'next', page: 3 })).toContain('cursor=next');
		expect(collectionPath({ cursor: 'next', page: 3, sortBy: 'name' })).toContain('page=3');
		expect(collectionPath({ cursor: 'next', page: 3, query: 'Rose' })).toContain('page=3');
	});

	it('prefers the cursor and otherwise advances the page', () => {
		expect(nextCollectionPosition({ hasNext: true, nextCursor: 'next', page: 2 })).toEqual({
			page: 0,
			cursor: 'next'
		});
		expect(
			nextCollectionPosition({ hasNext: true, nextCursor: 'next', page: 2, sortBy: 'NAME' })
		).toEqual({ page: 3, cursor: null });
		expect(nextCollectionPosition({ hasNext: true, nextCursor: null, page: 2 })).toEqual({
			page: 3,
			cursor: null
		});
		expect(nextCollectionPosition({ hasNext: false, nextCursor: 'ignored', page: 2 })).toBeNull();
	});
});
