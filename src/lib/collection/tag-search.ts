import type { CollectionTag } from '$lib/types';

export const normalizeTagSearch = (text: string) =>
	text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
export const matchingTag = (tags: CollectionTag[], name: string) =>
	tags.find(
		(tag) => tag.name.trim().localeCompare(name.trim(), 'fr', { sensitivity: 'accent' }) === 0
	);
