import { describe, expect, it, vi } from 'vitest';
import { restoreSession, sessionStorageKey } from './session';

describe('restoreSession', () => {
	it('supprime une session sans utilisateur identifiable', () => {
		const storage = {
			getItem: vi.fn(() => JSON.stringify({ accessToken: 'token' })),
			removeItem: vi.fn()
		} as unknown as Storage;

		expect(restoreSession(storage)).toBeNull();
		expect(storage.removeItem).toHaveBeenCalledWith(sessionStorageKey);
	});

	it('restaure une session contenant un utilisateur identifiable', () => {
		const storage = {
			getItem: vi.fn(() => JSON.stringify({ user: { id: 'user-id' } })),
			removeItem: vi.fn()
		} as unknown as Storage;

		expect(restoreSession(storage)?.user.id).toBe('user-id');
		expect(storage.removeItem).not.toHaveBeenCalled();
	});
});
