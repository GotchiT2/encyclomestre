import type { PageLoad } from './$types';
import { getCards, getSale, getSaleBids } from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => ({
	sale: getSale(params.id, { fetch }),
	bids: getSaleBids(params.id, { fetch }),
	cards: getCards({ page: 1, pageSize: 100 }, { fetch })
});
