import type { RequestOptions } from './client';
import {
	getWikiForgeBoosterStatus,
	openWikiForgeBooster,
	toCollectionCardRecord
} from './wikiforge';
import type { BoosterInventory, BoosterOpenResult } from '$lib/types';

export const getBoosterInventory = async (
	_userId?: string,
	options?: RequestOptions
): Promise<BoosterInventory> => {
	const status = await getWikiForgeBoosterStatus(options);
	return {
		available: status.availableBoosters,
		capacity: status.maxBoosters ?? 10,
		nextRechargeAt: status.nextBoosterAvailableAt
	};
};

export const openBooster = async (
	_userId?: string,
	options?: RequestOptions
): Promise<BoosterOpenResult> => {
	const response = await openWikiForgeBooster(options);
	return {
		pulls: response.cards.map((item) => ({
			card: toCollectionCardRecord(item),
			ownedBefore: 0,
			ownedAfter: 1
		})),
		inventory: await getBoosterInventory(undefined, options)
	};
};
