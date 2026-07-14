import type { PageLoad } from './$types';
import { getWikiForgeCollection, toCardPage } from '$lib/api';

export const load: PageLoad = ({ fetch }) => ({ collection: getWikiForgeCollection({}, { fetch }).then(toCardPage) });
