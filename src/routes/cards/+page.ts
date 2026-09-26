import type { PageLoad } from './$types';
import { getWikiForgePublicPages, toPublicPage } from '$lib/api';
import type { CardSearchSort } from '$lib/types';
import { defaultCardSearchSort } from '$lib/domain/cards/search';

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q') ?? '';
	const requestedSort = url.searchParams.get('sortBy');
	const explicitSort: CardSearchSort | undefined =
		requestedSort === 'name' || requestedSort === 'relevance' ? requestedSort : undefined;
	const sortBy = defaultCardSearchSort(query, explicitSort);
	const sortDirection = url.searchParams.get('sortDirection') === 'DESC' ? 'DESC' : 'ASC';
	return {
		cards: getWikiForgePublicPages(
			{
				page: Math.max(0, Number(url.searchParams.get('page') ?? 1) - 1),
				q: query,
				sortBy,
				sortDirection
			},
			{ fetch }
		).then(toPublicPage),
		filters: { query, sortBy, sortDirection }
	};
};
