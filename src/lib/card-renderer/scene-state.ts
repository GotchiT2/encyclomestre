import { writable } from 'svelte/store';

// The gallery releases its GPU context while the opening owns the stage.
export const cinematicSceneOwner = writable<symbol | null>(null);
