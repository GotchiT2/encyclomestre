import { describe, expect, it } from 'vitest';
import { clearSession, persistSession, restoreSession, sessionStorageKey } from './session';

function createStorage() {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key: string) => values.get(key) ?? null,
		key: (index: number) => [...values.keys()][index] ?? null,
		setItem: (key: string, value: string) => {
			values.set(key, value);
		},
		removeItem: (key: string) => {
			values.delete(key);
		}
	} satisfies Storage;
}

const session = {
	accessToken: 'token',
	refreshToken: 'refresh',
	user: {
		id: 'u1',
		username: 'demo',
		displayName: 'Demo',
		email: 'demo@test',
		avatarUrl: null,
		bio: null,
		role: 'user' as const,
		preferences: {
			language: 'fr',
			timezone: 'Europe/Paris',
			emailNotifications: true,
			marketingEmails: false
		},
		createdAt: '2026-01-01',
		updatedAt: '2026-01-01'
	}
};

describe('auth session persistence', () => {
	it('persists and restores the current session', () => {
		const storage = createStorage();
		persistSession(storage, session);
		expect(restoreSession(storage)).toEqual(session);
	});
	it('clears corrupted and logged out sessions', () => {
		const storage = createStorage();
		storage.setItem(sessionStorageKey, '{bad');
		expect(restoreSession(storage)).toBeNull();
		persistSession(storage, session);
		clearSession(storage);
		expect(storage.getItem(sessionStorageKey)).toBeNull();
	});
});
