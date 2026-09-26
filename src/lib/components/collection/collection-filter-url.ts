import type { CollectionBooleanFilter, CollectionSort } from '$lib/types';

export interface CollectionFilters {
	query: string;
	sortBy: CollectionSort;
	variantIds: number[];
	tagFilterIds: string[];
	duplicate: CollectionBooleanFilter;
	protected: CollectionBooleanFilter;
	wishlistOwnerId?: string;
}

export function effectiveCollectionQuery(query: string): string | undefined {
	const text = query.trim();
	return text.length >= 3 ? text : undefined;
}

export function buildCollectionFilterTarget(filters: CollectionFilters) {
	const parameters = new URLSearchParams();
	const query = effectiveCollectionQuery(filters.query);
	if (query) parameters.set('q', query);
	if (filters.sortBy !== 'acquiredDate') parameters.set('sortBy', filters.sortBy);
	filters.variantIds.forEach((variantId) => parameters.append('variant', String(variantId)));
	filters.tagFilterIds.forEach((tagId) => parameters.append('tag', tagId));
	if (filters.duplicate !== 'all') parameters.set('duplicate', filters.duplicate);
	if (filters.protected !== 'all') parameters.set('protected', filters.protected);
	if (filters.wishlistOwnerId) parameters.set('wishlist', filters.wishlistOwnerId);
	const queryString = parameters.toString();
	return queryString ? `/collection?${queryString}` : '/collection';
}
