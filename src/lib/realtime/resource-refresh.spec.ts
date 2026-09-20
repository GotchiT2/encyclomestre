import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
	publishNotificationRefresh,
	publishRealtimeRefresh,
	realtimeRefresh,
	refreshIncludes
} from './resource-refresh';

describe('targeted realtime refreshes', () => {
	it('refreshes only the resources affected by a trade notification', () => {
		publishNotificationRefresh([{ id: '1', type: 'TRADE_ACCEPTED', read: false, createdAt: '' }]);
		const refresh = get(realtimeRefresh);
		expect(refreshIncludes(refresh, 'trades')).toBe(true);
		expect(refreshIncludes(refresh, 'collection')).toBe(true);
		expect(refreshIncludes(refresh, 'profile')).toBe(true);
		expect(refreshIncludes(refresh, 'friends')).toBe(false);
	});

	it('deduplicates resource requests', () => {
		publishRealtimeRefresh(['friends', 'friends']);
		expect(get(realtimeRefresh).resources).toEqual(['friends']);
	});

	it('refreshes achievements after an unlock notification', () => {
		publishNotificationRefresh([
			{ id: 'achievement-1', type: 'ACHIEVEMENT_UNLOCKED', read: false, createdAt: '' }
		]);
		const refresh = get(realtimeRefresh);
		expect(refreshIncludes(refresh, 'achievements')).toBe(true);
		expect(refreshIncludes(refresh, 'profile')).toBe(true);
	});
});
