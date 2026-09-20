export type NotificationType =
	| 'TRADE_RECEIVED'
	| 'TRADE_COUNTERED'
	| 'TRADE_ACCEPTED'
	| 'TRADE_DECLINED'
	| 'TRADE_CANCELLED'
	| 'TRADE_EXPIRED'
	| 'SALE_SOLD'
	| 'FRIEND_REQUEST'
	| 'FRIEND_ACCEPTED'
	| 'ACHIEVEMENT_UNLOCKED'
	| (string & {});

export interface AppNotificationActor {
	id: string;
	name: string;
	imageUrl?: string | null;
}

export interface AppNotification {
	id: string;
	type: NotificationType;
	actor?: AppNotificationActor | null;
	extId?: string | null;
	meta?: Record<string, unknown> | null;
	read: boolean;
	createdAt: string;
}

export interface NotificationsPage {
	items: AppNotification[];
	nextCursor: string | null;
	hasNext: boolean;
	unread: number;
}
