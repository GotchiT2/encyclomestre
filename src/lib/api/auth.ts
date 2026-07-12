import { apiRequest, type RequestOptions } from './client';
import type { AuthSession, CreateUserInput, LoginInput, User } from '$lib/types';

export const register = (input: CreateUserInput, options?: RequestOptions) =>
	apiRequest<User>('/users', { ...options, method: 'POST', body: input });

export const login = (input: LoginInput, options?: RequestOptions) =>
	apiRequest<AuthSession>('/auth/login', { ...options, method: 'POST', body: input });

export const logout = (options?: RequestOptions) =>
	apiRequest<void>('/auth/logout', { ...options, method: 'POST' });
