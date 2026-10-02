import type { CardRecord } from '$lib/types';
export const openingReceiptPrefix = 'encyclomestre.arcade.opening.';
export type OpeningReceipt = {
	accountId: string;
	packId: number;
	cardIds: string[];
	openedCount: number;
	revealedIds: string[];
	page: number;
};
export function readOpeningReceipt(storage: Storage, accountId: string): OpeningReceipt | null {
	try {
		const receipt = JSON.parse(storage.getItem(openingReceiptPrefix + accountId) ?? 'null');
		if (
			!receipt ||
			receipt.accountId !== accountId ||
			!Number.isInteger(receipt.packId) ||
			receipt.packId <= 0 ||
			!Array.isArray(receipt.cardIds) ||
			!receipt.cardIds.length ||
			!receipt.cardIds.every((id: unknown) => typeof id === 'string' && id.length > 0) ||
			new Set(receipt.cardIds).size !== receipt.cardIds.length ||
			!Number.isInteger(receipt.openedCount) ||
			receipt.openedCount < 1
		)
			return null;
		// Migrate the former sequential discovery without changing the storage key.
		if (!Array.isArray(receipt.revealedIds)) {
			if (
				!Number.isInteger(receipt.revealed) ||
				receipt.revealed < 0 ||
				receipt.revealed > receipt.cardIds.length ||
				!Number.isInteger(receipt.index) ||
				receipt.index < 0 ||
				receipt.index >= receipt.cardIds.length
			)
				return null;
			receipt.revealedIds = receipt.cardIds.slice(0, receipt.revealed);
			receipt.page = Math.floor(receipt.index / 12);
		}
		if (
			!Number.isInteger(receipt.page) ||
			receipt.page < 0 ||
			receipt.page >= Math.ceil(receipt.cardIds.length / 12) ||
			new Set(receipt.revealedIds).size !== receipt.revealedIds.length ||
			!receipt.revealedIds.every(
				(id: unknown) => typeof id === 'string' && receipt.cardIds.includes(id)
			)
		)
			return null;
		return {
			accountId: receipt.accountId,
			packId: receipt.packId,
			cardIds: receipt.cardIds,
			openedCount: receipt.openedCount,
			revealedIds: receipt.revealedIds,
			page: receipt.page
		};
	} catch {
		return null;
	}
}
export function saveOpeningReceipt(storage: Storage, receipt: OpeningReceipt) {
	try {
		storage.setItem(openingReceiptPrefix + receipt.accountId, JSON.stringify(receipt));
	} catch {
		/* Opening remains usable without session storage. */
	}
}
export function clearOpeningReceipts(storage: Storage) {
	try {
		for (let index = storage.length - 1; index >= 0; index--) {
			const key = storage.key(index);
			if (key?.startsWith(openingReceiptPrefix)) storage.removeItem(key);
		}
	} catch {
		/* Storage may be disabled. */
	}
}
/** Reads authoritative cards in their original order; never fabricates a lost result. */
export async function restoreOpeningCards(
	receipt: OpeningReceipt,
	read: (id: string) => Promise<CardRecord>
) {
	const cards: CardRecord[] = new Array(receipt.cardIds.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(3, cards.length) }, async () => {
			while (next < receipt.cardIds.length) {
				const index = next++,
					id = receipt.cardIds[index];
				const card = await read(id);
				if (card.id !== id) throw new Error('OPENING_CARD_MISMATCH');
				cards[index] = card;
			}
		})
	);
	return cards;
}
