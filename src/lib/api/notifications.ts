import { apiRequest, type RequestOptions } from './client';
import { wikiForgeImageUrl } from './pages';
import { wikiForgeNumericId, wikiForgeIsoDate } from './wikiforge-contract';
import type { AppNotification, NotificationsPage } from '$lib/types';

interface NotificationDto {
	id: number;
	type: string;
	actor?: { id: number; name: string; image?: string | null } | null;
	extId?: number | null;
	meta?: string | null;
	read: boolean;
	creationDate: string;
}

interface NotificationsResultDto {
	results?: NotificationDto[] | null;
	nextCursor?: string | null;
	hasNext?: boolean;
	unread?: number;
}

function parseMeta(value?: string | null) {
	if (!value) return null;
	try {
		const parsed: unknown = JSON.parse(value);
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

export function toAppNotification(dto: NotificationDto): AppNotification {
	return {
		id: String(dto.id),
		type: dto.type,
		actor: dto.actor
			? {
					id: String(dto.actor.id),
					name: dto.actor.name,
					imageUrl: wikiForgeImageUrl(dto.actor.image)
				}
			: null,
		extId: dto.extId == null ? null : String(dto.extId),
		meta: parseMeta(dto.meta),
		read: dto.read,
		createdAt: wikiForgeIsoDate(dto.creationDate) ?? ''
	};
}

export async function getNotifications(
	input: { cursor?: string | null; unreadOnly?: boolean } = {},
	options?: RequestOptions
): Promise<NotificationsPage> {
	const params = new URLSearchParams();
	if (input.cursor) params.set('cursor', input.cursor);
	if (input.unreadOnly) params.set('unreadOnly', 'true');
	const result = await apiRequest<NotificationsResultDto>(
		`/notifications${params.size ? `?${params}` : ''}`,
		{
			...options,
			apiTarget: 'wikiforge'
		}
	);
	return {
		items: (result.results ?? []).map(toAppNotification),
		nextCursor: result.nextCursor ?? null,
		hasNext: result.hasNext ?? false,
		unread: result.unread ?? 0
	};
}

export const markNotificationRead = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/notifications/${wikiForgeNumericId(id, 'notification')}/read`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'PATCH'
	});

export const markAllNotificationsRead = (options?: RequestOptions) =>
	apiRequest<void>('/notifications/read-all', {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST'
	});
