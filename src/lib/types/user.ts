export type UserRole = 'user' | 'moderator' | 'admin';
export type ProfileVisibility = 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
export type LastConnection = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'AWAY';

export interface UserPreferences {
	language: string;
	timezone: string;
	emailNotifications: boolean;
	marketingEmails: boolean;
}

export interface User {
	id: string;
	username: string;
	displayName: string;
	email?: string;
	avatarUrl?: string | null;
	imagePageId?: number | null;
	nsfwEnabled?: boolean;
	safeWords?: string[];
	money?: number;
	visibility?: ProfileVisibility;
	rank?: number;
	lastConnection?: LastConnection;
	bio?: string | null;
	role: UserRole;
	preferences?: UserPreferences;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserInput {
	username: string;
	email: string;
	password: string;
	displayName?: string;
}

export interface UpdateUserInput {
	username?: string;
	displayName?: string;
	avatarUrl?: string | null;
	bio?: string | null;
}

export type UpdateUserPreferencesInput = Partial<UserPreferences>;
