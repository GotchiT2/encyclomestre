import { get, writable } from 'svelte/store';
export type ArcadePreferences = {
	density: 'grid';
	opening: 'immersive' | 'express';
	motion: 'system' | 'reduce';
};
export const arcadePreferences = writable<ArcadePreferences>({
	density: 'grid',
	opening: 'immersive',
	motion: 'system'
});
const key = 'encyclomestre.arcade.preferences';
export function hydrateArcadePreferences(storage: Storage) {
	try {
		const saved = JSON.parse(storage.getItem(key) ?? '{}');
		arcadePreferences.set({
			density: 'grid',
			opening: saved.opening === 'express' ? 'express' : 'immersive',
			motion: saved.motion === 'reduce' ? 'reduce' : 'system'
		});
	} catch {
		/* An unavailable browser store must not block the game. */
	}
	document.documentElement.dataset.motion = get(arcadePreferences).motion;
}
export function updateArcadePreferences(patch: Partial<ArcadePreferences>) {
	arcadePreferences.update((value) => ({ ...value, ...patch }));
	const value = get(arcadePreferences);
	document.documentElement.dataset.motion = value.motion;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* Preferences remain usable in memory. */
	}
}
