export const knownPackKeys = new Set(['daily', 'chrome', 'nebula', 'arcade', 'neon', 'comics']);

export const packNameKey = (value: string) =>
	knownPackKeys.has(value) ? `boosterPreview.packs.${value}` : null;

export const packDescriptionKey = (value: string) =>
	knownPackKeys.has(value) ? `boosterPreview.descriptions.${value}` : null;
