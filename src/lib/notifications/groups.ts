import type { AppNotification } from '$lib/types';

export type NotificationFamily =
	'TRADE' | 'AUCTION' | 'SALE' | 'FRIEND' | 'GUILD' | 'ACHIEVEMENT' | 'MODERATION' | 'OTHER';
const families: NotificationFamily[] = [
	'TRADE',
	'AUCTION',
	'SALE',
	'FRIEND',
	'GUILD',
	'ACHIEVEMENT',
	'MODERATION'
];
export function groupNotifications(items: AppNotification[]) {
	const groups = new Map<NotificationFamily, AppNotification[]>();
	for (const item of [...new Map(items.map((item) => [item.id, item])).values()]) {
		const family = families.find((family) => item.type.startsWith(family + '_')) ?? 'OTHER';
		groups.set(family, [...(groups.get(family) ?? []), item]);
	}
	const date = (item: AppNotification) => Date.parse(item.createdAt) || 0;
	return [...groups]
		.map(([family, notifications]) => ({
			family,
			items: notifications.sort((a, b) => date(b) - date(a)),
			unread: notifications.filter((item) => !item.read).length
		}))
		.sort((a, b) => date(b.items[0]) - date(a.items[0]));
}
