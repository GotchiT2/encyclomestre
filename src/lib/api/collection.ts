import {
	getWikiForgeCollection,
	getWikiForgeVariantCopies,
	toCollectionCardRecord,
	toCollectionPage
} from './wikiforge';
import type { RequestOptions } from './client';

export const getCollection = async (options?: RequestOptions) =>
	toCollectionPage(await getWikiForgeCollection({ size: 100 }, options));

export const getVariantCopies = async (variantId: string, options?: RequestOptions) =>
	(await getWikiForgeVariantCopies(variantId, options)).map(toCollectionCardRecord);
