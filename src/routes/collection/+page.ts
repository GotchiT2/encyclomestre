import type { PageLoad } from './$types';
import { getCollection } from '$lib/api';

export const load: PageLoad = ({ fetch }) => ({ collection: getCollection({ fetch }) });
