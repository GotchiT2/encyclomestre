import type { PageLoad } from './$types';
import {
	getCards,
	getProfileRegistrySummary,
	getProfileSettings,
	getSales,
	getUser,
	getUserCollection
} from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => ({
	user: getUser(params.id, { fetch }),
	collection: getUserCollection(params.id, { fetch }),
	catalogue: getCards({ page: 1, pageSize: 100 }, { fetch }),
	settings: getProfileSettings(params.id, { fetch }),
	summary: getProfileRegistrySummary(params.id, { fetch }),
	sales: getSales(params.id, { fetch })
});
