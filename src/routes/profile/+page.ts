import {
	getCurrentUser,
	getMyShowcase,
	getUserInstantSales,
	getWikiForgeCollectionPage,
	getWikiForgeTags
} from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ fetch }) => {
	const user = getCurrentUser({ fetch });
	return {
		user,
		showcase: getMyShowcase({ fetch }),
		collection: getWikiForgeCollectionPage({}, { fetch }),
		tags: getWikiForgeTags({ fetch }).catch(() => []),
		sales: user.then((current) => getUserInstantSales(current.id, { fetch }))
	};
};
