import { getCards, getCollection } from '$lib/api';
import type { PageLoad } from './$types';
export const load: PageLoad = ({ fetch }) => ({
	collection: getCollection({ fetch }),
	cards: getCards({ pageSize: 100 }, { fetch })
});
