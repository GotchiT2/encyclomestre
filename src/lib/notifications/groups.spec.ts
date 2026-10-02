import { describe, expect, it } from 'vitest';
import type { AppNotification } from '$lib/types';
import { groupNotifications } from './groups';

const item = (id: string, type: string, day: number, read = false): AppNotification => ({
	id,
	type,
	read,
	createdAt: new Date(Date.UTC(2026, 9, day)).toISOString()
});
describe('notification families across loaded pages', () => {
	it('merges families, deduplicates overlapping pages and orders groups and events by recency', () => {
		const groups = groupNotifications([
			item('trade-old', 'TRADE_RECEIVED', 1),
			item('friend', 'FRIEND_REQUEST', 3),
			item('trade-new', 'TRADE_ACCEPTED', 4),
			item('friend', 'FRIEND_REQUEST', 3, true),
			item('unknown', 'FUTURE_EVENT', 2),
			item('auction', 'AUCTION_OUTBID', 5)
		]);
		expect(groups.map((g) => g.family)).toEqual(['AUCTION', 'TRADE', 'FRIEND', 'OTHER']);
		expect(groups[1].items.map((n) => n.id)).toEqual(['trade-new', 'trade-old']);
		expect(groups[1].unread).toBe(2);
		expect(groups[2].items).toHaveLength(1);
		expect(groups[2].unread).toBe(0);
	});
	it('handles missing dates and all confirmed families without inventing a global count', () => {
		const types = ['SALE_SOLD', 'GUILD_INVITE', 'ACHIEVEMENT_UNLOCKED', 'MODERATION_REPLY'];
		const groups = groupNotifications(
			types.map((type, i) => ({ ...item('' + i, type, 1), createdAt: '' }))
		);
		expect(groups.map((g) => g.family)).toEqual(['SALE', 'GUILD', 'ACHIEVEMENT', 'MODERATION']);
		expect(groups.reduce((sum, g) => sum + g.unread, 0)).toBe(4);
		expect(groupNotifications([])).toEqual([]);
	});
});
