import { getWikiForgeCollection, toCollectionPage } from './wikiforge';
import type { RequestOptions } from './client';

export const getCollection = async (options?: RequestOptions) =>
	toCollectionPage(await getWikiForgeCollection({ size: 100 }, options));
