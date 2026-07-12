import { getCards, getCollection } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ fetch }) => ({
	cards: getCards({ pageSize: 100 }, { fetch }),
	collection: getCollection({ fetch })
});
