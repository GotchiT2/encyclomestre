import type { User } from './user';

export interface LoginInput {
	username: string;
	password: string;
}

export interface AuthSession {
	access_token?: string;
	refresh_token?: string;
	user: User;
}
