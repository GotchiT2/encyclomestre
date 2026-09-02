import type { PageLoad } from './$types';
import { getUserInstantSales, getUserProfile } from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => ({
	profile: getUserProfile(params.id, { fetch }),
	sales: getUserInstantSales(params.id, { fetch }).catch(() => ({ instantSales: [] }))
});
