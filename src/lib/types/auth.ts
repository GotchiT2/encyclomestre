import type { User } from './user';

export interface LoginInput {
	email: string;
	password: string;
}

export interface AuthSession {
	accessToken?: string;
	refreshToken?: string;
	user: User;
}
