import type { PageLoad } from './$types';
import {
	getCardPriceHistory,
	getCardSales,
	getWikiForgeCard,
	getWikiForgeCollection,
	getWikiForgeTags,
	toCardRecord,
	toCollectionPage
} from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => ({
	card: getWikiForgeCard(params.id, { fetch }).then(toCardRecord),
	collection: getWikiForgeCollection({ size: 100 }, { fetch }).then(toCollectionPage),
	tags: getWikiForgeTags({ fetch }),
	sales: getCardSales(params.id, { fetch }),
	priceHistory: getCardPriceHistory(params.id, { fetch })
});
