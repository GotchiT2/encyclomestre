import type { User, UserRole } from '$lib/types';

export interface OAuthCurrentUserResponse {
	id: string | number;
	name: string;
	email: string;
	roles: string[];
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
		role: toUserRole(profile.roles),
		createdAt: profile.createdAt,
		updatedAt: profile.createdAt
	};
}
