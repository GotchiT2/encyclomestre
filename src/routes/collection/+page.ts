import { getWikiForgeCollectionPage, getWikiForgeTags, hydrateCardSocialStates } from '$lib/api';
import { cardRarityCodeByName, cardRarityOptions } from '$lib/domain/cards/rarities';
import type { CardRarity, CollectionBooleanFilter, CollectionSort } from '$lib/types';
import type { PageLoad } from './$types';

const validRarities = new Set(cardRarityOptions.map((rarity) => rarity.value));
const booleanFilter = (value: string | null): CollectionBooleanFilter =>
	value === 'yes' || value === 'no' ? value : 'all';

export const load: PageLoad = ({ fetch, url }) => {
	const query = url.searchParams.get('q')?.trim() ?? '';
	const selectedRarities = url.searchParams
		.getAll('rarity')
		.filter((rarity): rarity is CardRarity => validRarities.has(rarity as CardRarity));
	const tagFilterIds = url.searchParams
		.getAll('tag')
		.filter((id) => Number.isSafeInteger(Number(id)) && Number(id) > 0);
	const requestedSort = url.searchParams.get('sortBy');
	const sortBy: CollectionSort =
		requestedSort === 'rarity' || requestedSort === 'name' ? requestedSort : 'acquiredDate';
	const duplicate = booleanFilter(url.searchParams.get('duplicate'));
	const protection = booleanFilter(url.searchParams.get('protected'));

	return {
		collection: getWikiForgeCollectionPage(
			{
				query,
				sortBy,
				rarities: selectedRarities.map((rarity) => cardRarityCodeByName[rarity]),
				tagIds: tagFilterIds,
				duplicate,
				protected: protection
			},
			{ fetch }
		).then(async (response) => ({
			...response,
			items: await hydrateCardSocialStates(response.items, { fetch })
		})),
		tags: getWikiForgeTags({ fetch }),
		filters: { query, selectedRarities, tagFilterIds, sortBy, duplicate, protection }
	};
};
