import { defaultLayout, validateLayout, type Layout } from './layout';
import { validateBlueprint, type CardBlueprint } from './blueprint';
export const ENGINE_VERSION = 3;
export const themes = ['classic', 'cyberpunk', 'space', 'comics', 'kawaii', 'japanese'] as const;
export type Theme = (typeof themes)[number];
export interface Design {
	theme: Theme;
	orientation: 'auto' | 'portrait' | 'landscape';
	titlePosition: 'bottom' | 'top' | 'side';
	titleWidth: number;
	margin: number;
	pattern: 'none' | 'lines' | 'dots' | 'waves';
	density: number;
	patternOpacity: number;
	secondary: string;
	font: 'sans' | 'serif' | 'mono';
	weight: number;
	lineHeight: number;
	serialPosition: 'left' | 'right';
	serialSize: number;
	serialFinish: 'plain' | 'silver' | 'gold';
	foil: 'none' | 'metallic' | 'holographic' | 'prismatic' | 'glitter';
	foilColor: string;
	foilColor2: string;
	intensity: number;
	angle: number;
	shineWidth: number;
	scale: number;
	target: 'frame' | 'image' | 'decoration';
	motion: 'static' | 'pointer' | 'animated';
	speed: number;
}
export interface Visual {
	model: 'base' | 'chrome' | 'signature';
	color: string;
	cartouche: string;
	border: number;
	radius: number;
	align: 'left' | 'center' | 'right';
	fontSize: number;
	lines: number;
	fit: 'cover' | 'contain';
	x: number;
	y: number;
}
export interface TemplateDefinition {
	schemaVersion: 1 | 2 | 3;
	minEngineVersion: 1 | 2 | 3;
	presentation?: CardBlueprint;
	layout?: Layout;
	visual: Visual;
	design: Design;
}
export interface RenderData {
	title: string;
	image: string;
	variantName: string;
	fullArt: boolean;
	serial?: number;
	maximum?: number;
	blurred?: boolean;
	boosterLogo?: string;
	edition?: string;
	description?: string;
}
export const designOptions = {
	theme: themes,
	orientation: ['auto', 'portrait', 'landscape'],
	titlePosition: ['bottom', 'top', 'side'],
	pattern: ['none', 'lines', 'dots', 'waves'],
	font: ['sans', 'serif', 'mono'],
	serialPosition: ['left', 'right'],
	serialFinish: ['plain', 'silver', 'gold'],
	foil: ['none', 'metallic', 'holographic', 'prismatic', 'glitter'],
	target: ['frame', 'image', 'decoration'],
	motion: ['static', 'pointer', 'animated']
} as const;
export const designRanges = {
	titleWidth: [40, 100, 1],
	margin: [2, 12, 0.5],
	density: [5, 40, 1],
	patternOpacity: [0, 60, 1],
	weight: [400, 900, 100],
	lineHeight: [1, 1.5, 0.05],
	serialSize: [3, 7, 0.25],
	intensity: [0, 70, 1],
	angle: [0, 360, 1],
	shineWidth: [5, 60, 1],
	scale: [5, 60, 1],
	speed: [2, 20, 1]
} as const;
export function themeDesign(theme: Theme = 'classic'): Design {
	const base: Design = {
		theme,
		orientation: 'auto',
		titlePosition: 'bottom',
		titleWidth: 100,
		margin: 4.5,
		pattern: 'none',
		density: 18,
		patternOpacity: 15,
		secondary: '#e4b354',
		font: 'sans',
		weight: 800,
		lineHeight: 1.1,
		serialPosition: 'right',
		serialSize: 4.5,
		serialFinish: 'plain',
		foil: 'none',
		foilColor: '#7ce9ff',
		foilColor2: '#e89aff',
		intensity: 20,
		angle: 120,
		shineWidth: 22,
		scale: 20,
		target: 'frame',
		motion: 'static',
		speed: 8
	};
	const overrides: Partial<Design> =
		theme === 'cyberpunk'
			? {
					pattern: 'lines',
					font: 'mono',
					secondary: '#ef47bd',
					foil: 'holographic',
					titleWidth: 85
				}
			: theme === 'space'
				? {
						pattern: 'dots',
						secondary: '#bca7ff',
						foil: 'prismatic',
						titleWidth: 80
					}
				: theme === 'comics'
					? {
							pattern: 'dots',
							secondary: '#ffda42',
							weight: 900,
							titleWidth: 90,
							angle: 30
						}
					: theme === 'kawaii'
						? {
								pattern: 'dots',
								secondary: '#ffc2da',
								weight: 600,
								titleWidth: 90,
								foilColor: '#ffc2da',
								foilColor2: '#baf6df'
							}
						: theme === 'japanese'
							? {
									pattern: 'waves',
									font: 'serif',
									secondary: '#d6493a',
									titleWidth: 75,
									foil: 'metallic',
									foilColor: '#e5c78f',
									foilColor2: '#fff0cc'
								}
							: {};
	return { ...base, ...overrides };
}
export const colorValid = (v: unknown): v is string =>
	typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
export function validateDefinition(input: unknown): TemplateDefinition {
	if (!input || typeof input !== 'object') throw new Error('INVALID_TEMPLATE');
	const d = input as TemplateDefinition;
	if (d.schemaVersion === 3) {
		if (d.minEngineVersion !== 3) throw new Error('UNSUPPORTED_TEMPLATE_VERSION');
		const legacy = validateDefinition({ ...d, schemaVersion: 2, minEngineVersion: 2 });
		return {
			...legacy,
			schemaVersion: 3,
			minEngineVersion: 3,
			presentation: validateBlueprint(d.presentation)
		};
	}
	if (
		![1, 2].includes(d.schemaVersion) ||
		![1, 2].includes(d.minEngineVersion) ||
		(d.schemaVersion === 2 && d.minEngineVersion !== 2) ||
		!d.visual ||
		!d.design
	)
		throw new Error('UNSUPPORTED_TEMPLATE_VERSION');
	const v = d.visual;
	for (const color of [
		v.color,
		v.cartouche,
		d.design.secondary,
		d.design.foilColor,
		d.design.foilColor2
	])
		if (!colorValid(color)) throw new Error('INVALID_TEMPLATE');
	for (const [key, options] of Object.entries(designOptions))
		if (!(options as readonly unknown[]).includes(d.design[key as keyof Design]))
			throw new Error('INVALID_TEMPLATE');
	for (const [key, [min, max]] of Object.entries(designRanges)) {
		const n = d.design[key as keyof Design];
		if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max)
			throw new Error('INVALID_TEMPLATE');
	}
	if (
		!['base', 'chrome', 'signature'].includes(v.model) ||
		!['left', 'center', 'right'].includes(v.align) ||
		!['cover', 'contain'].includes(v.fit)
	)
		throw new Error('INVALID_TEMPLATE');
	for (const [key, min, max] of [
		['border', 0, 8],
		['radius', 0, 30],
		['fontSize', 4, 10],
		['lines', 1, 4],
		['x', 0, 100],
		['y', 0, 100]
	] as const)
		if (!Number.isFinite(v[key]) || v[key] < min || v[key] > max)
			throw new Error('INVALID_TEMPLATE');
	if (!Number.isInteger(v.lines)) throw new Error('INVALID_TEMPLATE');
	// Whitelist structural fields. Layout validates isolated presentation declarations.
	const visual: Visual = {
		model: v.model,
		color: v.color,
		cartouche: v.cartouche,
		border: v.border,
		radius: 0,
		align: v.align,
		fontSize: v.fontSize,
		lines: v.lines,
		fit: v.fit,
		x: v.x,
		y: v.y
	};
	const design = {
		secondary: d.design.secondary,
		foilColor: d.design.foilColor,
		foilColor2: d.design.foilColor2
	} as Design;
	for (const key of [
		...Object.keys(designOptions),
		...Object.keys(designRanges)
	] as (keyof Design)[])
		Object.assign(design, { [key]: d.design[key] });
	return {
		schemaVersion: 2,
		minEngineVersion: 2,
		visual,
		design,
		layout: validateLayout(
			d.schemaVersion === 1 ? (d.layout ?? migrateLayout(d.design, d.visual)) : d.layout
		)
	};
}
export function templateRef(key: string): { id: string; revision: number } | null {
	const m = /^tpl:([a-z0-9][a-z0-9-]{0,39})@([1-9][0-9]{0,8})$/.exec(key);
	return m ? { id: m[1], revision: Number(m[2]) } : null;
}
export const landscapeFor = (
	orientation: Design['orientation'],
	fullArt: boolean,
	width: number,
	height: number
) =>
	orientation === 'landscape' ||
	(orientation === 'auto' && fullArt && width > 0 && height > 0 && width > height);

export const themePalette: Record<Theme, { color: string; cartouche: string }> = {
	classic: { color: '#18566a', cartouche: '#f5f0e5' },
	cyberpunk: { color: '#3ee8eb', cartouche: '#111729' },
	space: { color: '#928fe2', cartouche: '#17233d' },
	comics: { color: '#17171b', cartouche: '#ffed6e' },
	kawaii: { color: '#ea9bbc', cartouche: '#fff0f6' },
	japanese: { color: '#233952', cartouche: '#f5e8cf' }
};
export function migrateLayout(design: Design, visual: Visual): Layout {
	const l = defaultLayout(design.theme);
	if (design.theme === 'classic' && visual.model !== 'base') {
		l.zones.frame.background = '#111923';
		l.zones.inner.borderColor = visual.color;
	}
	const key =
		design.target === 'image'
			? 'imageFinish'
			: design.target === 'decoration'
				? 'decorFinish'
				: 'frameFinish';
	l[key] = {
		...l[key],
		type: design.foil,
		color: design.foilColor,
		second: design.foilColor2,
		intensity: design.intensity,
		angle: design.angle,
		scale: design.scale,
		motion: design.motion,
		speed: design.speed
	};
	return l;
}
export function presetDefinition(theme: Theme): TemplateDefinition {
	return validateDefinition({
		schemaVersion: 2,
		minEngineVersion: 2,
		layout: defaultLayout(theme),
		visual: {
			model: 'base',
			...themePalette[theme],
			border: 2,
			radius: 0,
			align: 'left',
			fontSize: 7,
			lines: 3,
			fit: 'cover',
			x: 50,
			y: 35
		},
		design: themeDesign(theme)
	});
}
