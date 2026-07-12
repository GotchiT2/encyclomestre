import type { CardRecord } from './card';

export interface BoosterInventory {
	available: number;
	capacity: number;
	nextRechargeAt: string | null;
}

export interface BoosterPull {
	card: CardRecord;
	ownedBefore: number;
	ownedAfter: number;
}

export interface BoosterOpenResult {
	pulls: BoosterPull[];
	inventory: BoosterInventory;
}
