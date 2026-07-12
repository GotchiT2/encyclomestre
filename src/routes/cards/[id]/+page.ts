import type { PageLoad } from './$types';
import { getCard, getCardPriceHistory, getCardSales } from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => ({
	card: getCard(params.id, { fetch }),
	priceHistory: getCardPriceHistory(params.id, { fetch }),
	sales: getCardSales(params.id, { fetch })
});
