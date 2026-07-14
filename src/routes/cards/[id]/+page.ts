import type { PageLoad } from './$types';
import { getWikiForgeCard, toCardRecord } from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => ({
	card: getWikiForgeCard(params.id, { fetch }).then(toCardRecord),
	sales: Promise.resolve([]),
	priceHistory: Promise.resolve({ cardId: params.id, points: [] })
});
