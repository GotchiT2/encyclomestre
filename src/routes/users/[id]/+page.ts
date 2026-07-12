import type { PageLoad } from './$types';
import { getUser, getUserCollection } from '$lib/api';

export const load: PageLoad = ({ params, fetch }) => ({
	user: getUser(params.id, { fetch }),
	collection: getUserCollection(params.id, { fetch })
});
