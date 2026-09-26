/** Local presentation contract. No assumptions about future API endpoints. */
export type RenderKey =
	'standard' | 'full-art' | 'chrome' | 'nebula' | 'arcade' | 'neon' | 'comics';
export interface VisualVariant {
	id: number;
	name: string;
	color: string;
	styles: ('NORMAL' | 'FULL_ART' | 'CHROME')[];
	renderKey: RenderKey;
	printRun?: number;
}
export interface Subject {
	id: string;
	title: string;
	descriptionKey: string;
	image: string;
	imageMode: 'portrait' | 'landscape' | 'logo';
	focalPoint?: string;
	logoBackground?: string;
	source: string;
	author: string;
	license: 'CC BY 3.0' | 'Public domain';
	licenseUrl: string;
}
export interface PreviewCard {
	id: string;
	subjectId: string;
	variantId: number;
	edition: string;
	serial?: { number: number; total: number };
}
export interface PreviewPack {
	id: string;
	kind: 'daily' | 'annual' | 'theme';
	nameKey: string;
	descriptionKey: string;
	renderKey: RenderKey;
	color: string;
	edition: string;
	variantIds: number[];
	heroSubject: string;
	startsAt?: string;
	endsAt?: string;
}

const commons = (file: string) =>
	`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;
const cc = {
	license: 'CC BY 3.0' as const,
	licenseUrl: 'https://creativecommons.org/licenses/by/3.0/'
};
const pd = {
	license: 'Public domain' as const,
	licenseUrl: 'https://commons.wikimedia.org/wiki/Commons:Threshold_of_originality'
};
export const subjects: Subject[] = [
	{
		id: 'blackpink',
		title: 'BLACKPINK',
		descriptionKey: 'blackpink',
		image: '/images/booster-preview/blackpink.png',
		imageMode: 'landscape',
		source: commons('20240809_Blackpink_Pink_Carpet_09.png'),
		author: 'K-POPIT 케이팝잇',
		...cc
	},
	{
		id: 'rose',
		title: 'Rosé',
		descriptionKey: 'rose',
		image: '/images/booster-preview/rose.png',
		imageMode: 'portrait',
		focalPoint: '50% 25%',
		source: commons('Rosé_BLACKPINK_PUBG_Mobile_Sept_2020_ad.png'),
		author: 'PUBG Mobile / Blue Hole Studio',
		...cc
	},
	{
		id: 'karina',
		title: 'Karina',
		descriptionKey: 'karina',
		image: '/images/booster-preview/karina.jpg',
		imageMode: 'portrait',
		focalPoint: '50% 25%',
		source: commons('Aespa_Karina_2024_MMA_2.jpg'),
		author: '10Asia',
		...cc
	},
	{
		id: 'star-wars',
		title: 'Star Wars',
		descriptionKey: 'star_wars',
		image: '/images/booster-preview/star-wars.svg',
		imageMode: 'logo',
		logoBackground: '#000000',
		source: commons('Star_Wars_Logo.svg'),
		author: 'Wikimedia Commons',
		...pd
	},
	{
		id: 'lotr',
		title: 'Le Seigneur des anneaux : La Communauté de l’anneau',
		descriptionKey: 'lotr',
		image: '/images/booster-preview/lotr.svg',
		imageMode: 'logo',
		source: commons("Le_Seigneur_des_anneaux_la_Communauté_de_l'anneau.svg"),
		author: 'Wikimedia Commons',
		...pd
	}
];

export const variants: VisualVariant[] = [
	{ id: 1, name: 'Standard', color: '#b8f2d5', styles: ['NORMAL'], renderKey: 'standard' },
	{ id: 2, name: 'Full art', color: '#ffe144', styles: ['FULL_ART'], renderKey: 'full-art' },
	{ id: 3, name: 'Chrome', color: '#b1cff2', styles: ['CHROME'], renderKey: 'chrome' },
	{
		id: 4,
		name: 'Chrome · Bleu',
		color: '#68a7ff',
		styles: ['FULL_ART', 'CHROME'],
		renderKey: 'chrome',
		printRun: 99
	},
	{ id: 5, name: 'Néon', color: '#ed6fa3', styles: ['FULL_ART'], renderKey: 'neon', printRun: 99 },
	{
		id: 6,
		name: 'Chrome · Violet',
		color: '#bf94ff',
		styles: ['FULL_ART', 'CHROME'],
		renderKey: 'chrome',
		printRun: 50
	},
	{
		id: 7,
		name: 'Chrome · Or',
		color: '#ffd475',
		styles: ['FULL_ART', 'CHROME'],
		renderKey: 'chrome',
		printRun: 10
	},
	{
		id: 8,
		name: 'Chrome · Arc-en-ciel',
		color: '#f4c7ff',
		styles: ['FULL_ART', 'CHROME'],
		renderKey: 'chrome',
		printRun: 1
	},
	{
		id: 9,
		name: 'Nébuleuse',
		color: '#b69aff',
		styles: ['FULL_ART'],
		renderKey: 'nebula',
		printRun: 99
	},
	{
		id: 10,
		name: 'Nébuleuse · Or',
		color: '#ffd475',
		styles: ['FULL_ART'],
		renderKey: 'nebula',
		printRun: 10
	},
	{
		id: 11,
		name: 'Arcade',
		color: '#8df5b4',
		styles: ['FULL_ART'],
		renderKey: 'arcade',
		printRun: 99
	},
	{
		id: 12,
		name: 'Arcade · Or',
		color: '#ffd475',
		styles: ['FULL_ART'],
		renderKey: 'arcade',
		printRun: 10
	},
	{
		id: 13,
		name: 'Néon · Or',
		color: '#ffd475',
		styles: ['FULL_ART'],
		renderKey: 'neon',
		printRun: 10
	},
	{
		id: 14,
		name: 'Comics',
		color: '#ff857c',
		styles: ['FULL_ART'],
		renderKey: 'comics',
		printRun: 99
	},
	{
		id: 15,
		name: 'Comics · Or',
		color: '#ffd475',
		styles: ['FULL_ART'],
		renderKey: 'comics',
		printRun: 10
	}
];

export const packs: PreviewPack[] = [
	{
		id: 'daily',
		kind: 'daily',
		nameKey: 'daily',
		descriptionKey: 'daily',
		renderKey: 'standard',
		color: '#b8f2d5',
		edition: 'ESSENTIELS',
		variantIds: [1, 2],
		heroSubject: 'blackpink'
	},
	{
		id: 'chrome',
		kind: 'annual',
		nameKey: 'chrome',
		descriptionKey: 'chrome',
		renderKey: 'chrome',
		color: '#b1cff2',
		edition: 'CHROME 2026',
		variantIds: [3, 4, 6, 7, 8],
		heroSubject: 'rose',
		startsAt: '2026-01-01T00:00:00Z',
		endsAt: '2027-01-01T00:00:00Z'
	},
	...(['nebula', 'arcade', 'neon', 'comics'] as const).map((id, index) => ({
		id,
		kind: 'theme' as const,
		nameKey: id,
		descriptionKey: id,
		renderKey: id,
		color: ['#b69aff', '#8df5b4', '#ed6fa3', '#ff857c'][index],
		edition: ['ORBITAL 01', 'PLAYER 01', 'AFTER DARK 01', 'ISSUE 01'][index],
		variantIds: [
			[1, 9, 10],
			[1, 11, 12],
			[1, 5, 13],
			[1, 14, 15]
		][index],
		heroSubject: ['star-wars', 'lotr', 'karina', 'blackpink'][index]
	}))
];

export const getVariant = (id: number) => variants.find((variant) => variant.id === id)!;
export const getSubject = (id: string) => subjects.find((subject) => subject.id === id)!;
export const isLandscapeCard = (card: PreviewCard) =>
	getSubject(card.subjectId).imageMode !== 'portrait' &&
	getVariant(card.variantId).styles.includes('FULL_ART');
export const poolKey = (packId: string, subjectId: string, variantId: number) =>
	`${packId}:${subjectId}:${variantId}`;
export const previewCard = (
	pack: PreviewPack,
	variantId: number,
	subjectId = pack.heroSubject
): PreviewCard => ({
	id: `preview:${pack.id}:${subjectId}:${variantId}`,
	subjectId,
	variantId,
	edition: variantId === 1 || variantId === 2 ? packs[0].edition : pack.edition
});

export const scenarios = [
	'normal',
	'daily-wait',
	'chrome-expired',
	'last',
	'exhausted',
	'missing-image'
] as const;
export type Scenario = (typeof scenarios)[number];
export interface PreviewSession {
	version: 1;
	scenario: Scenario;
	dailyAvailableAt: number;
	openings: number;
	/** Remaining serials, separated by subject, edition (pack) and variant. */
	pools: Record<string, number[]>;
}
export const STORAGE_KEY = 'wikiforge.boosters.preview.v1';

export function createSession(scenario: Scenario = 'normal', now = Date.now()): PreviewSession {
	const pools: Record<string, number[]> = {};
	for (const pack of packs)
		for (const subject of subjects)
			for (const id of pack.variantIds) {
				const variant = getVariant(id);
				if (!variant.printRun) continue;
				// Reproducible stock already partly opened, to make the stock browser useful.
				const consumed =
					variant.printRun === 1
						? 0
						: Math.floor(variant.printRun * (0.2 + subjects.indexOf(subject) * 0.12));
				pools[poolKey(pack.id, subject.id, id)] = Array.from(
					{ length: variant.printRun - consumed },
					(_, i) => i + consumed + 1
				);
			}
	if (scenario === 'last' || scenario === 'exhausted') {
		for (const key of Object.keys(pools)) if (key.startsWith('nebula:')) pools[key] = [];
		if (scenario === 'last') pools[poolKey('nebula', 'star-wars', 10)] = [7];
	}
	return {
		version: 1,
		scenario,
		dailyAvailableAt: scenario === 'daily-wait' ? now + 86_400_000 : 0,
		openings: 0,
		pools
	};
}

export function restoreSession(raw: string | null): PreviewSession {
	if (!raw) return createSession();
	try {
		const data = JSON.parse(raw) as PreviewSession;
		const baseline = createSession();
		if (
			data.version !== 1 ||
			!scenarios.includes(data.scenario) ||
			!Number.isSafeInteger(data.openings) ||
			data.openings < 0 ||
			!Number.isFinite(data.dailyAvailableAt) ||
			data.dailyAvailableAt < 0
		)
			throw new Error('Invalid session');
		if (!data.pools || Object.keys(data.pools).length !== Object.keys(baseline.pools).length)
			throw new Error('Invalid pools');
		for (const key of Object.keys(baseline.pools)) {
			const serials = data.pools[key];
			const total = getVariant(Number(key.split(':')[2])).printRun!;
			if (
				!Array.isArray(serials) ||
				new Set(serials).size !== serials.length ||
				serials.some((n) => !Number.isInteger(n) || n < 1 || n > total)
			)
				throw new Error('Invalid serials');
		}
		return data;
	} catch {
		return createSession();
	}
}

export function stockFor(pack: PreviewPack, session: PreviewSession) {
	return Object.entries(session.pools)
		.filter(([key]) => key.startsWith(`${pack.id}:`))
		.reduce((sum, [, serials]) => sum + serials.length, 0);
}
export function unavailableReason(
	pack: PreviewPack,
	session: PreviewSession,
	now = Date.now()
): 'daily_wait' | 'expired' | 'not_started' | 'exhausted' | null {
	if (pack.kind === 'daily' && now < session.dailyAvailableAt) return 'daily_wait';
	if (
		pack.kind === 'annual' &&
		(session.scenario === 'chrome-expired' || now >= Date.parse(pack.endsAt!))
	)
		return 'expired';
	if (pack.startsAt && now < Date.parse(pack.startsAt)) return 'not_started';
	if (pack.kind === 'theme' && stockFor(pack, session) === 0) return 'exhausted';
	return null;
}

export function openPreviewPack(
	pack: PreviewPack,
	session: PreviewSession,
	now = Date.now(),
	random = Math.random
): { session: PreviewSession; cards: PreviewCard[] } {
	const reason = unavailableReason(pack, session, now);
	if (reason) throw new Error(reason);
	const pick = (length: number) => Math.min(length - 1, Math.floor(Math.max(0, random()) * length));
	const next: PreviewSession = {
		...session,
		openings: session.openings + 1,
		pools: { ...session.pools },
		dailyAvailableAt: pack.kind === 'daily' ? now + 86_400_000 : session.dailyAvailableAt
	};
	const cards = Array.from({ length: 5 }, (_, i): PreviewCard => ({
		id: `opening:${next.openings}:${i}`,
		subjectId: subjects[pick(subjects.length)].id,
		variantId: pack.kind === 'annual' ? 3 : 1,
		edition: pack.kind === 'annual' ? pack.edition : packs[0].edition
	}));
	if (pack.kind === 'daily') {
		if (random() < 0.1) cards[4].variantId = 2;
	} else if (pack.kind === 'theme' || random() < 0.2) {
		const count = stockFor(pack, session);
		if (count > 0) {
			let offset = pick(count);
			for (const [key, serials] of Object.entries(session.pools)) {
				if (!key.startsWith(`${pack.id}:`)) continue;
				if (offset >= serials.length) {
					offset -= serials.length;
					continue;
				}
				const [, subjectId, id] = key.split(':');
				const variant = getVariant(Number(id));
				cards[4] = {
					...cards[4],
					subjectId,
					variantId: variant.id,
					edition: pack.edition,
					serial: { number: serials[offset], total: variant.printRun! }
				};
				next.pools[key] = serials.filter((_, index) => index !== offset);
				break;
			}
		}
	}
	return { session: next, cards };
}
