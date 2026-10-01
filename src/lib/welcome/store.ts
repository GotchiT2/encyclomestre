import { writable } from 'svelte/store';
import { getWikiForgeWelcome } from '$lib/api/welcome';
import type { DashboardData } from '$lib/types';

/** Agrégat de session partagé entre l'accueil et les autres écrans. */
export const welcomeError = writable(false);
let generation = 0;
export const currentWelcome = writable<DashboardData | null>(null);

let loadingWelcome: Promise<DashboardData> | null = null;

export async function refreshCurrentWelcome(force = false): Promise<DashboardData> {
	if (loadingWelcome) {
		if (!force) return loadingWelcome;
		await loadingWelcome.catch(() => undefined);
		return refreshCurrentWelcome();
	}
	const revision = generation;
	welcomeError.set(false);
	const pending = getWikiForgeWelcome()
		.then((welcome) => {
			if (revision === generation) currentWelcome.set(welcome);
			return welcome;
		})
		.catch((cause) => {
			if (revision === generation) welcomeError.set(true);
			throw cause;
		});
	loadingWelcome = pending;
	try {
		return await loadingWelcome;
	} finally {
		if (loadingWelcome === pending) loadingWelcome = null;
	}
}

export function clearCurrentWelcome() {
	generation++;
	welcomeError.set(false);
	loadingWelcome = null;
	currentWelcome.set(null);
}
