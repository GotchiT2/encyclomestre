import { writable } from 'svelte/store';
import { getWikiForgeWelcome } from '$lib/api/welcome';
import type { DashboardData } from '$lib/types';

/** Agrégat de session partagé entre l'accueil et les autres écrans. */
export const currentWelcome = writable<DashboardData | null>(null);

let loadingWelcome: Promise<DashboardData> | null = null;

export async function refreshCurrentWelcome(): Promise<DashboardData> {
	if (loadingWelcome) return loadingWelcome;
	loadingWelcome = getWikiForgeWelcome().then((welcome) => {
		currentWelcome.set(welcome);
		return welcome;
	});
	try {
		return await loadingWelcome;
	} finally {
		loadingWelcome = null;
	}
}

export function clearCurrentWelcome() {
	loadingWelcome = null;
	currentWelcome.set(null);
}
