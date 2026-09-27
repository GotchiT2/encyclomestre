import { clearDrafts } from '$lib/drafts/storage';
import { writable } from 'svelte/store';
import type { AuthSession } from '$lib/types';

export const sessionStorageKey = 'encyclomestre.auth-session';
export const currentSession = writable<AuthSession | null>(null);
/**
 * Une session restaurée du stockage local doit être validée par `/me` avant
 * d'ouvrir des canaux qui ne savent pas transporter le Bearer token (SSE).
 */
export const verifiedWikiForgeSession = writable(false);

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

export function markWikiForgeSessionVerified() {
	verifiedWikiForgeSession.set(true);
}

export function clearSession(storage: Storage) {
	clearDrafts(storage);
	storage.removeItem(sessionStorageKey);
	currentSession.set(null);
	verifiedWikiForgeSession.set(false);
}

export function hydrateSession(storage: Storage) {
	const session = restoreSession(storage);
	currentSession.set(session);
	verifiedWikiForgeSession.set(false);
	return session;
}
