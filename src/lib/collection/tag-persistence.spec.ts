import { describe, expect, it } from 'vitest';
import {
	collectionTagsStorageKey,
	defaultCollectionTagState,
	persistCollectionTagState,
	restoreCollectionTagState
} from './tag-persistence';

function createStorage() {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key: string) => values.get(key) ?? null,
		key: (index: number) => [...values.keys()][index] ?? null,
		setItem: (key: string, value: string) => {
			values.set(key, value);
		},
		removeItem: (key: string) => {
			values.delete(key);
		}
	} satisfies Storage;
}

describe('collection tag persistence', () => {
	it('restores demo data when storage is empty', () => {
		const state = restoreCollectionTagState(createStorage());
		expect(state.tags.length).toBeGreaterThan(0);
		expect(Object.keys(state.assignments).length).toBeGreaterThan(0);
	});

	it('merges saved data and migrates a missing tag color', () => {
		const storage = createStorage();
		storage.setItem(
			collectionTagsStorageKey,
			JSON.stringify({
				tags: [{ id: 'personal', name: 'À garder' }],
				assignments: { 'girls-generation-1': ['personal'] }
			})
		);

		const state = restoreCollectionTagState(storage);
		expect(state.tags.find((tag) => tag.id === 'personal')).toMatchObject({ color: '#C19A6B' });
		expect(state.assignments['girls-generation-1']).toContain('personal');
	});

	it('clears corrupted data and falls back to defaults', () => {
		const storage = createStorage();
		storage.setItem(collectionTagsStorageKey, '{not-json');
		const state = restoreCollectionTagState(storage);
		expect(storage.getItem(collectionTagsStorageKey)).toBeNull();
		expect(state).toEqual(defaultCollectionTagState());
	});

	it('persists a collection tag state', () => {
		const storage = createStorage();
		const state = defaultCollectionTagState();
		persistCollectionTagState(storage, state);
		expect(JSON.parse(storage.getItem(collectionTagsStorageKey) ?? '')).toEqual(state);
	});
});
