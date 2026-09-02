import { browser } from '$app/environment';
import {
	getMyShowcase,
	getUserInstantSales,
	getWikiForgeCollectionPage,
	getWikiForgeTags
} from '$lib/api';
import { restoreSession } from '$lib/auth/session';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ fetch }) => {
	// `/me` est déjà relu et validé par le layout de session. Réutiliser son id
	// évite une seconde requête bloquante et permet de lancer les quatre lectures ensemble.
	const userId = browser ? restoreSession(localStorage)?.user.id : undefined;
	return {
		showcase: getMyShowcase({ fetch }),
		collection: getWikiForgeCollectionPage({}, { fetch }),
		tags: getWikiForgeTags({ fetch }).catch(() => []),
		sales: userId ? getUserInstantSales(userId, { fetch }) : Promise.resolve({ instantSales: [] })
	};
};
