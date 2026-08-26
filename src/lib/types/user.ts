export type UserRole = 'user' | 'moderator' | 'admin';

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
