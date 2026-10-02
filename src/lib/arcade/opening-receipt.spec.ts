import { describe, expect, it } from 'vitest';
import {
	readOpeningReceipt,
	saveOpeningReceipt,
	clearOpeningReceipts,
	restoreOpeningCards,
	openingReceiptPrefix,
	type OpeningReceipt
} from './opening-receipt';
import { mockCards } from '$lib/api/mocks/cards';
function storage(): Storage {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		key: (index) => [...values.keys()][index] ?? null,
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => {
			values.set(key, value);
		},
		removeItem: (key) => {
			values.delete(key);
		},
		clear: () => values.clear()
	};
}
const receipt: OpeningReceipt = {
	accountId: '1',
	packId: 2,
	cardIds: ['17', '3', '91'],
	openedCount: 1,
	revealed: 1,
	index: 0
};
describe('opening recovery', () => {
	it('keeps progress and ids within the account session', () => {
		const session = storage();
		saveOpeningReceipt(session, receipt);
		expect(readOpeningReceipt(session, '1')).toEqual(receipt);
		expect(readOpeningReceipt(session, '2')).toBeNull();
		session.setItem('other', 'kept');
		clearOpeningReceipts(session);
		expect(readOpeningReceipt(session, '1')).toBeNull();
		expect(session.getItem('other')).toBe('kept');
	});
	it('rejects corrupt progress and a receipt copied from another account', () => {
		const session = storage();
		for (const bad of [
			{ ...receipt, revealed: 99 },
			{ ...receipt, accountId: '2' },
			{ ...receipt, index: -1 },
			{ ...receipt, cardIds: ['17', '17'] },
			{ ...receipt, openedCount: 0 }
		]) {
			session.setItem(openingReceiptPrefix + '1', JSON.stringify(bad));
			expect(readOpeningReceipt(session, '1')).toBeNull();
		}
	});
	it('preserves server order when reads finish in a different order', async () => {
		const actual = await restoreOpeningCards(receipt, async (id) => {
			await new Promise((resolve) => setTimeout(resolve, id === '17' ? 15 : 1));
			return { ...mockCards[0], id };
		});
		expect(actual.map((card) => card.id)).toEqual(receipt.cardIds);
	});
	it('does not invent inaccessible results', async () => {
		await expect(
			restoreOpeningCards(receipt, async () => {
				throw new Error('NOT_FOUND');
			})
		).rejects.toThrow('NOT_FOUND');
	});
	it('rejects a different exemplar returned by the API', async () => {
		await expect(
			restoreOpeningCards(receipt, async () => ({ ...mockCards[0], id: 'other' }))
		).rejects.toThrow('OPENING_CARD_MISMATCH');
	});
});
