import type { AppNotification } from '$lib/types';
/** Destinations from documented identifiers only; metadata is never interpreted as a URL. */
export function notificationTarget(
	notification: Pick<AppNotification, 'type' | 'extId'>
): string | null {
	const { type, extId } = notification;
	const id = extId && /^\d+$/.test(extId) ? extId : null;
	if (type.startsWith('AUCTION_')) return id ? `/market/${id}` : '/market';
	if (type.startsWith('MODERATION_')) return id ? `/moderation/${id}` : '/moderation';
	if (type === 'ACHIEVEMENT_UNLOCKED') return '/achievements';
	if (type.startsWith('TRADE_')) return id ? `/trades?trade=${id}` : '/trades';
	if (type.startsWith('FRIEND_')) return '/friends';
	if (type.startsWith('SALE_')) return '/profile';
	if (type.startsWith('GUILD_')) return '/guild';
	return null;
}
