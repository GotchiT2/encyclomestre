import { writable, readable, derived, get } from 'svelte/store';
import type { Sanction } from '$lib/api/moderation';
import { currentSession } from '$lib/auth/session';
import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';

export const sanctions = writable<Sanction[]>([]);
const clock = readable(Date.now(), (set) => {
	const timer = setInterval(() => set(Date.now()), 1000);
	return () => clearInterval(timer);
});
export const activeRestrictions = derived(
	[sanctions, clock, currentSession],
	([items, now, session]) => (session ? currentSanctions(items, now).map((item) => item.type) : [])
);
let account: string | undefined;
let loadedAt = 0;
let pending: Promise<void> | undefined;
export async function refreshSanctions(force = false) {
	const user = get(currentSession)?.user.id;
	if (account !== user) {
		account = user;
		loadedAt = 0;
		sanctions.set([]);
		pending = undefined;
	}
	if (!user || (!force && Date.now() - loadedAt < 60_000)) return;
	if (pending) return pending;
	const task = import('$lib/api/moderation')
		.then(({ getSanctions }) => getSanctions())
		.then((items) => {
			if (get(currentSession)?.user.id === user) {
				sanctions.set(items);
				loadedAt = Date.now();
			}
		})
		.finally(() => {
			if (pending === task) pending = undefined;
		});
	pending = task;
	return task;
}
export function currentSanctions(items: Sanction[], now: number) {
	return items.filter(
		(item) =>
			(!item.startsAt || wikiForgeUtcDate(item.startsAt).getTime() <= now) &&
			(!item.endsAt || wikiForgeUtcDate(item.endsAt).getTime() > now)
	);
}
export function acceptSanction(value: unknown) {
	if (
		!value ||
		typeof value !== 'object' ||
		!('type' in value) ||
		!['MUTE', 'TRADE', 'BAN'].includes(String(value.type))
	)
		return;
	const incoming = value as Sanction;
	sanctions.update((items) => [...items.filter((item) => item.type !== incoming.type), incoming]);
}
