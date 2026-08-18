import { getWikiForgePublicPage, toPublicPageCardRecord } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ fetch, params }) => ({
	card: getWikiForgePublicPage(params.id, { fetch }).then(toPublicPageCardRecord)
});
