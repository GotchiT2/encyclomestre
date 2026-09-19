import { getWikiForgeCollectionPage, getWikiForgeTags } from '$lib/api';
import type { CollectionBooleanFilter, CollectionSort } from '$lib/types';
import type { PageLoad } from './$types';

const booleanFilter = (value: string | null): CollectionBooleanFilter =>
	value === 'yes' || value === 'no' ? value : 'all';

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q') ?? '';
	const requestedSort = url.searchParams.get('sortBy');
	const sortBy: CollectionSort = requestedSort === 'name' ? 'name' : 'acquiredDate';
	const variantIds = url.searchParams
		.getAll('variant')
		.map(Number)
		.filter((id) => Number.isSafeInteger(id) && id > 0);
	const tagFilterIds = url.searchParams.getAll('tag');
	const duplicate = booleanFilter(url.searchParams.get('duplicate'));
	const protection = booleanFilter(url.searchParams.get('protected'));
	const wishlistOwnerId = url.searchParams.get('wishlistOwner') ?? '';
	return {
		tags: getWikiForgeTags({ fetch }),
		collection: getWikiForgeCollectionPage(
			{
				query,
				sortBy,
				variantIds,
				tagIds: tagFilterIds,
				duplicate,
				protected: protection,
				wishlistOwnerId
			},
			{ fetch }
		),
		filters: { query, sortBy, variantIds, tagFilterIds, duplicate, protection, wishlistOwnerId }
	};
};
