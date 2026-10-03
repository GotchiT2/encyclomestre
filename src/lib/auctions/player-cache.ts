import { getUserIdentity, type UserIdentity } from '$lib/api/player-profile';

/** One cache per detail visit; never stored across accounts or routes. */
export function createAuctionPlayerCache(read = getUserIdentity) {
	const abort = new AbortController();
	const pending = new Map<string, Promise<UserIdentity | null>>();
	return {
		get(id: string) {
			let value = pending.get(id);
			if (!value) {
				value = read(id, { signal: abort.signal }).catch(() => null);
				pending.set(id, value);
			}
			return value;
		},
		dispose() {
			abort.abort();
			pending.clear();
		}
	};
}
