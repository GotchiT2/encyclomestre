import type { PageLoad } from './$types';
import { getCard, getCardPriceHistory, getSale, getSaleBids } from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => {
	const sale = getSale(params.id, { fetch });
	return {
		sale,
		bids: getSaleBids(params.id, { fetch }),
		card: sale.then((listing) => getCard(listing.cardId, { fetch })),
		priceHistory: sale.then((listing) => getCardPriceHistory(listing.cardId, { fetch }))
	};
};
