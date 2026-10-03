import type { User } from './user';

export interface LoginInput {
	email: string;
	password: string;
	turnstileToken: string;
}

export interface AuthSession {
	accessToken?: string;
	refreshToken?: string;
	accessTokenExpiresAt?: number;
	user: User;
}

export interface OAuth2TokenResponse {
	recovery_codes?: string[];
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in: number;
}
