import { writable } from 'svelte/store';
import type { Banner } from '$lib/types';
export const currentBanners = writable<Banner[]>([]);
export function replaceBanners(value: unknown) {
	const list = Array.isArray(value) ? value : [];
	currentBanners.set(
		list.filter(
			(item): item is Banner =>
				Boolean(item) &&
				typeof item === 'object' &&
				typeof item.message === 'string' &&
				typeof item.id === 'number'
		)
	);
}
