import type {
	LastConnection,
	MutedNotificationCategory,
	ProfileVisibility,
	User,
	UserRole
} from '$lib/types';
import { wikiForgeUtcDate } from './wikiforge-contract';

export interface OAuthCurrentUserResponse {
	id: string | number;
	name: string;
	email: string;
	roles: string[];
	imagePageId?: number | null;
	image?: string | null;
	nsfw?: boolean;
	safeWords?: string[];
	mutedNotifications?: MutedNotificationCategory[];
	money?: number;
	visibility?: ProfileVisibility;
	rank?: number;
	lastConnection?: LastConnection;
	createdAt: string;
}

function toUserRole(roles: string[]): UserRole {
	if (roles.some((role) => role.toUpperCase() === 'ADMIN')) return 'admin';
	if (roles.some((role) => role.toUpperCase() === 'MODERATOR')) return 'moderator';
	return 'user';
}

/** Converts the OAuth profile payload into the user shape used by the existing application. */
export function toCurrentUser(profile: OAuthCurrentUserResponse): User {
	return {
		id: String(profile.id),
		username: profile.name,
		displayName: profile.name,
		email: profile.email,
		avatarUrl: profile.image ?? null,
		imagePageId: profile.imagePageId ?? null,
		nsfwEnabled: Boolean(profile.nsfw),
		safeWords: profile.safeWords ?? [],
		mutedNotifications: profile.mutedNotifications ?? [],
		...(typeof profile.money === 'number' ? { money: profile.money } : {}),
		visibility: profile.visibility ?? 'FRIENDS',
		...(typeof profile.rank === 'number' ? { rank: profile.rank } : {}),
		lastConnection: profile.lastConnection,
		role: toUserRole(profile.roles),
		createdAt: wikiForgeUtcDate(profile.createdAt).toISOString(),
		updatedAt: wikiForgeUtcDate(profile.createdAt).toISOString()
	};
}
