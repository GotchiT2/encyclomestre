import { writable } from 'svelte/store';
import type { CardRecord } from '$lib/types';

export interface NsfwFilterSettings {
	enabled: boolean;
	keywords: string[];
}

const defaults: NsfwFilterSettings = { enabled: false, keywords: [] };

/** Baseline local: terms which should always be hidden while NSFW display is disabled. */
export const defaultNsfwKeywords = Object.freeze([
	'contenu adulte',
	'adulte',
	'pornographie',
	'pornographique',
	'porno',
	'érotique',
	'érotisme',
	'sexualité',
	'sexual',
	'sexuel',
	'sexuelle',
	'sexuellement',
	'sexe explicite',
	'rapport sexuel',
	'relation sexuelle',
	'acte sexuel',
	'copulation',
	'coït',
	'masturbation',
	'orgasme',
	'éjaculation',
	'pénétration',
	'fellation',
	'cunnilingus',
	'anulingus',
	'sodomie',
	'sexe anal',
	'sexe oral',
	'vagin',
	'vulve',
	'clitoris',
	'pénis',
	'verge',
	'testicule',
	'scrotum',
	'appareil génital',
	'organe génital',
	'organes génitaux',
	'génital',
	'sein nu',
	'mamelon',
	'prostitution',
	'prostituée',
	'prostitué',
	'escort',
	'striptease',
	'fétichisme',
	'fétiche sexuel',
	'bdsm',
	'bondage',
	'sadomasochisme',
	'violence sexuelle',
	'nudité',
	'nude',
	'pornography',
	'oral sex',
	'anal sex',
	'genital'
]);

export const nsfwFilterSettings = writable<NsfwFilterSettings>(defaults);

function normalize(value: string): string {
	return value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLocaleLowerCase('fr-FR');
}

export function setNsfwFilterSettings(settings: Partial<NsfwFilterSettings>) {
	nsfwFilterSettings.set({
		enabled: Boolean(settings.enabled),
		keywords: (settings.keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean)
	});
}

export function shouldBlurCardIllustration(
	card: Pick<CardRecord, 'title' | 'shortDescription' | 'longDescription' | 'nsfw'>,
	settings: NsfwFilterSettings
): boolean {
	if (settings.enabled) return false;
	if (card.nsfw) return true;
	const content = normalize(`${card.title} ${card.shortDescription} ${card.longDescription}`);
	return [...defaultNsfwKeywords, ...settings.keywords].some((keyword) =>
		content.includes(normalize(keyword))
	);
}
