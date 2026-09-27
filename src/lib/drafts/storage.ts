export const draftPrefix = 'wikiforge.draft.';
export const draftLifetime = 24 * 60 * 60 * 1000;
export function draftKey(account: string, target: string) {
	return `${draftPrefix}${encodeURIComponent(account)}.${encodeURIComponent(target)}`;
}
export function readDraft(storage: Storage, key: string, now = Date.now()): string | null {
	try {
		const raw = storage.getItem(key);
		if (!raw) return null;
		const entry = JSON.parse(raw);
		if (
			typeof entry.value !== 'string' ||
			!Number.isFinite(entry.expires) ||
			entry.expires <= now
		) {
			storage.removeItem(key);
			return null;
		}
		return entry.value;
	} catch {
		return null;
	}
}
export function writeDraft(storage: Storage, key: string, value: string, now = Date.now()) {
	try {
		if (!value) storage.removeItem(key);
		else storage.setItem(key, JSON.stringify({ value, expires: now + draftLifetime }));
	} catch {
		/* Storage may be unavailable or full. */
	}
}
export function clearDrafts(storage: Storage) {
	try {
		for (let i = storage.length - 1; i >= 0; i--) {
			const key = storage.key(i);
			if (key?.startsWith(draftPrefix)) storage.removeItem(key);
		}
	} catch {
		/* Optional storage. */
	}
}
