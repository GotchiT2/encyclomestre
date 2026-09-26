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
	| 'GUILD_INVITE'
	| 'GUILD_JOINED'
	| 'GUILD_KICKED'
	| 'GUILD_PROMOTED'
	| 'GUILD_OWNER_CHANGED'
	| 'GUILD_DISBANDED'
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
