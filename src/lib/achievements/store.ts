import { get, writable } from 'svelte/store';
import { getAchievements } from '$lib/api/achievements';
import { ApiError } from '$lib/api/client';
import { achievementClaimableCount, type Achievement } from '$lib/types';

export type AchievementAvailability = 'idle' | 'ready' | 'unavailable' | 'error';

export const achievementAvailability = writable<AchievementAvailability>('idle');
export const claimableAchievements = writable(0);

let currentLoad: Promise<Achievement[]> | null = null;

/** Loads once per session while the endpoint is unavailable; explicit user retries may force it. */
export function refreshAchievementSummary(force = false): Promise<Achievement[]> {
	if (!force && get(achievementAvailability) === 'unavailable') return Promise.resolve([]);
	if (currentLoad) return currentLoad;

	currentLoad = getAchievements()
		.then((achievements) => {
			claimableAchievements.set(achievementClaimableCount(achievements));
			achievementAvailability.set('ready');
			return achievements;
		})
		.catch((error: unknown) => {
			claimableAchievements.set(0);
			achievementAvailability.set(error instanceof ApiError && error.status === 404 ? 'unavailable' : 'error');
			throw error;
		})
		.finally(() => {
			currentLoad = null;
		});

	return currentLoad;
}

export function resetAchievementSummary() {
	currentLoad = null;
	claimableAchievements.set(0);
	achievementAvailability.set('idle');
}
