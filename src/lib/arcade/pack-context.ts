import { writable } from 'svelte/store';
import { getPacks } from '$lib/api/boosters';
export const packNames = writable<Record<number, string>>({});
let pending: Promise<void> | null = null;
export function loadPackNames() {
	if (!pending)
		pending = getPacks()
			.then((packs) => packNames.set(Object.fromEntries(packs.map((pack) => [pack.id, pack.name]))))
			.catch(() => {
				pending = null;
			});
	return pending;
}
