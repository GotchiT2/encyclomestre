import { writable } from 'svelte/store';
import type { AuthSession } from '$lib/types';

export const sessionStorageKey = 'encyclomestre.auth-session';
export const currentSession = writable<AuthSession | null>(null);

export function restoreSession(storage: Storage) {
	const rawSession = storage.getItem(sessionStorageKey);
	if (!rawSession) return null;

	try {
		const session = JSON.parse(rawSession) as Partial<AuthSession>;
		if (!session.user || typeof session.user.id !== 'string') {
			storage.removeItem(sessionStorageKey);
			return null;
		}
		return session as AuthSession;
	} catch {
		storage.removeItem(sessionStorageKey);
		return null;
	}
}

export function persistSession(storage: Storage, session: AuthSession) {
	storage.setItem(sessionStorageKey, JSON.stringify(session));
	currentSession.set(session);
}

export function clearSession(storage: Storage) {
	storage.removeItem(sessionStorageKey);
	currentSession.set(null);
}

export function hydrateSession(storage: Storage) {
	const session = restoreSession(storage);
	currentSession.set(session);
	return session;
}
