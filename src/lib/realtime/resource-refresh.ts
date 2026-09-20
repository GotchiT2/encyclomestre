import { writable } from 'svelte/store';
import type { AppNotification } from '$lib/types';

export type RealtimeResource =
	| 'achievements'
	| 'collection'
	| 'friends'
	| 'messages'
	| 'notifications'
	| 'profile'
	| 'trades';

export interface RealtimeRefresh {
	revision: number;
	resources: readonly RealtimeResource[];
}

export const realtimeRefresh = writable<RealtimeRefresh>({ revision: 0, resources: [] });

export function publishRealtimeRefresh(resources: Iterable<RealtimeResource>) {
	const unique = [...new Set(resources)];
	if (!unique.length) return;
	realtimeRefresh.update((current) => ({ revision: current.revision + 1, resources: unique }));
}

export function publishNotificationRefresh(notifications: AppNotification[]) {
	const resources = new Set<RealtimeResource>(['notifications']);
	for (const notification of notifications) {
		if (notification.type === 'ACHIEVEMENT_UNLOCKED') {
			resources.add('achievements');
			resources.add('profile');
		} else if (notification.type.startsWith('TRADE_')) {
			resources.add('trades');
			resources.add('collection');
			resources.add('profile');
		} else if (notification.type === 'SALE_SOLD') {
			resources.add('collection');
			resources.add('profile');
		} else if (notification.type === 'FRIEND_REQUEST' || notification.type === 'FRIEND_ACCEPTED') {
			resources.add('friends');
		}
	}
	publishRealtimeRefresh(resources);
}

export function refreshIncludes(refresh: RealtimeRefresh, resource: RealtimeResource): boolean {
	return refresh.resources.includes(resource);
}
