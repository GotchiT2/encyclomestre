import type { CollectionTag, CollectionTagAssignments } from '$lib/types';
import { mockCards } from './cards';

export const mockCollectionTags: CollectionTag[] = [
	{ id: 'tag-favori', name: 'Favori', color: '#feb823' },
	{ id: 'tag-echange', name: 'Échange', color: '#1dcf47' },
	{ id: 'tag-recherche', name: 'Recherche', color: '#b41dcf' }
];

export const mockCollectionTagAssignments: CollectionTagAssignments = Object.fromEntries(
	mockCards
		.filter((card) => card.ownedCount > 0)
		.map((card, index) => [
			card.id,
			index % 3 === 0
				? ['tag-favori', 'tag-echange', 'tag-recherche']
				: index % 3 === 1
					? ['tag-echange', 'tag-recherche']
					: ['tag-recherche']
		])
);
