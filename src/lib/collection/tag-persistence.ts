import { mockCollectionTagAssignments, mockCollectionTags } from '$lib/api/mocks/collection-tags';
import type { CollectionTag, CollectionTagAssignments } from '$lib/types';

export const collectionTagsStorageKey = 'encyclomestre.collection-tags';

export interface CollectionTagState {
	tags: CollectionTag[];
	assignments: CollectionTagAssignments;
}

type StoredCollectionTagState = {
	tags?: CollectionTag[];
	assignments?: CollectionTagAssignments;
};

function normalizeTags(tags: CollectionTag[]) {
	return tags
		.filter((tag, index, list) => list.findIndex((candidate) => candidate.id === tag.id) === index)
		.map((tag) => ({ ...tag, color: tag.color || '#C19A6B' }));
}

function mergeAssignments(assignments: CollectionTagAssignments) {
	return Object.fromEntries(
		[...new Set([...Object.keys(mockCollectionTagAssignments), ...Object.keys(assignments)])].map(
			(cardId) => [
				cardId,
				[
					...new Set([
						...(mockCollectionTagAssignments[cardId] ?? []),
						...(assignments[cardId] ?? [])
					])
				]
			]
		)
	);
}

export function defaultCollectionTagState(): CollectionTagState {
	return {
		tags: [...mockCollectionTags],
		assignments: mergeAssignments({})
	};
}

export function restoreCollectionTagState(storage: Storage): CollectionTagState {
	const rawState = storage.getItem(collectionTagsStorageKey);
	if (!rawState) return defaultCollectionTagState();

	try {
		const stored = JSON.parse(rawState) as StoredCollectionTagState;
		return {
			tags: normalizeTags([...mockCollectionTags, ...(stored.tags ?? [])]),
			assignments: mergeAssignments(stored.assignments ?? {})
		};
	} catch {
		storage.removeItem(collectionTagsStorageKey);
		return defaultCollectionTagState();
	}
}

export function persistCollectionTagState(storage: Storage, state: CollectionTagState) {
	storage.setItem(collectionTagsStorageKey, JSON.stringify(state));
}
