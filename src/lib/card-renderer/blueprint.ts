/** CSS-only, resource-free card presentation. Content is supplied separately. */
export type CardStyle = Record<string, string>;
export const contents = [
	'group',
	'image',
	'title',
	'description',
	'collection',
	'serial',
	'logo',
	'decoration'
] as const;
export type CardContent = (typeof contents)[number];
export interface CardMotion {
	trigger: 'active' | 'pointer' | 'reveal';
	duration: number;
	easing: string;
	loop: boolean;
	frames: CardStyle[];
}
export interface CardLayer {
	id: string;
	content: CardContent;
	parent?: string;
	style: CardStyle;
	landscape?: CardStyle;
	compact?: CardStyle;
	motion?: CardMotion;
}
export interface CardBlueprint {
	version: 1;
	orientation: 'auto' | 'portrait' | 'landscape';
	portrait: string;
	landscape: string;
	style: CardStyle;
	landscapeStyle?: CardStyle;
	compactStyle?: CardStyle;
	layers: CardLayer[];
}
export const MAX_RENDER_KEY = 131072;
export const flame =
	'M107 14L137 62L91 172L151 122L183 207L153 259H83L121 170L43 259L10 210L31 149L111 62Z';
export const cardProperties = [
	'position',
	'inset',
	'top',
	'right',
	'bottom',
	'left',
	'width',
	'height',
	'min-width',
	'max-width',
	'min-height',
	'max-height',
	'display',
	'flex',
	'flex-direction',
	'flex-wrap',
	'align-items',
	'align-self',
	'justify-content',
	'gap',
	'row-gap',
	'column-gap',
	'grid-template-columns',
	'grid-template-rows',
	'grid-column',
	'grid-row',
	'place-items',
	'order',
	'padding',
	'padding-inline',
	'padding-block',
	'margin',
	'margin-inline',
	'margin-block',
	'background',
	'background-color',
	'background-image',
	'background-size',
	'background-position',
	'color',
	'opacity',
	'border',
	'border-width',
	'border-style',
	'border-color',
	'border-radius',
	'border-top',
	'border-bottom',
	'border-left',
	'border-right',
	'box-shadow',
	'text-shadow',
	'font-family',
	'font-size',
	'font-weight',
	'font-style',
	'line-height',
	'letter-spacing',
	'text-align',
	'text-transform',
	'white-space',
	'overflow-wrap',
	'word-break',
	'text-overflow',
	'-webkit-line-clamp',
	'object-fit',
	'object-position',
	'clip-path',
	'filter',
	'mix-blend-mode',
	'transform',
	'transform-origin',
	'aspect-ratio',
	'overflow',
	'z-index',
	'visibility'
] as const;
const allowed = new Set<string>(cardProperties);
function record(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
export function validateCardStyle(value: unknown): CardStyle {
	if (!record(value) || Object.keys(value).length > 64) throw new Error('INVALID_CARD_CSS');
	const result: CardStyle = {};
	for (const [key, raw] of Object.entries(value)) {
		if (
			!allowed.has(key) ||
			typeof raw !== 'string' ||
			!raw.trim() ||
			raw.length > 1500 ||
			/[;{}@\\<>]|url\s*\(|image-set|expression|paint\s*\(|attr\s*\(|env\s*\(|!important|\/\*/i.test(
				raw
			) ||
			!/^[\w\s#(),.%+/'"*-]+$/.test(raw) ||
			(key === 'position' && !['absolute', 'relative', 'static'].includes(raw)) ||
			(key === 'z-index' && !/^(?:auto|[0-9]{1,2})$/.test(raw)) ||
			(key === 'display' &&
				!['block', 'flex', 'grid', 'inline', 'inline-block', 'inline-flex', 'none'].includes(
					raw
				)) ||
			(key === 'font-family' &&
				!/^(?:'Barlow Condensed'|'Barlow'|Barlow|Georgia|Inter|serif|sans-serif|monospace)(?:\s*,\s*(?:serif|sans-serif|monospace))?$/.test(
					raw
				))
		)
			throw new Error('INVALID_CARD_CSS');
		const stripped = raw.replace(/var\(--wf-pointer-[xy]\)/g, '50%');
		if (/var\s*\(/i.test(stripped)) throw new Error('INVALID_CARD_CSS');
		if (typeof CSS !== 'undefined' && !CSS.supports(key, raw)) throw new Error('INVALID_CARD_CSS');
		result[key] = raw.trim();
	}
	return result;
}
export const styleText = (style: CardStyle) =>
	Object.entries(style)
		.map(([key, value]) => `${key}:${value}`)
		.join(';');
export function validateBlueprint(value: unknown): CardBlueprint {
	if (
		!record(value) ||
		value.version !== 1 ||
		!['auto', 'portrait', 'landscape'].includes(String(value.orientation)) ||
		!Array.isArray(value.layers) ||
		!value.layers.length ||
		value.layers.length > 48
	)
		throw new Error('INVALID_CARD_BLUEPRINT');
	const ratio = (v: unknown) => {
		if (typeof v !== 'string' || !/^\d{1,2}\s*\/\s*\d{1,2}$/.test(v))
			throw new Error('INVALID_CARD_RATIO');
		const [w, h] = v.split('/').map(Number);
		if (w <= 0 || h <= 0 || w / h < 0.4 || w / h > 2.5) throw new Error('INVALID_CARD_RATIO');
		return v;
	};
	const ids = new Set<string>();
	const layers = value.layers.map((raw): CardLayer => {
		if (
			!record(raw) ||
			typeof raw.id !== 'string' ||
			!/^[a-z][a-z0-9-]{0,39}$/.test(raw.id) ||
			ids.has(raw.id) ||
			!contents.includes(raw.content as CardContent) ||
			(raw.parent !== undefined && typeof raw.parent !== 'string')
		)
			throw new Error('INVALID_CARD_LAYER');
		ids.add(raw.id);
		let motion: CardMotion | undefined;
		if (raw.motion !== undefined) {
			const m = raw.motion;
			if (
				!record(m) ||
				!['active', 'pointer', 'reveal'].includes(String(m.trigger)) ||
				typeof m.duration !== 'number' ||
				!Number.isFinite(m.duration) ||
				m.duration < 80 ||
				m.duration > 30000 ||
				typeof m.easing !== 'string' ||
				!/^(?:linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\([0-9.,\s-]+\))$/.test(
					m.easing
				) ||
				typeof m.loop !== 'boolean' ||
				!Array.isArray(m.frames) ||
				m.frames.length < 2 ||
				m.frames.length > 12
			)
				throw new Error('INVALID_CARD_MOTION');
			motion = {
				trigger: m.trigger as CardMotion['trigger'],
				duration: m.duration,
				easing: m.easing,
				loop: m.loop,
				frames: m.frames.map(validateCardStyle)
			};
			if (m.easing.startsWith('cubic-bezier')) {
				const values = m.easing
					.slice(m.easing.indexOf('(') + 1, -1)
					.split(',')
					.map(Number);
				if (
					values.length !== 4 ||
					values.some((v) => !Number.isFinite(v)) ||
					values[0] < 0 ||
					values[0] > 1 ||
					values[2] < 0 ||
					values[2] > 1
				)
					throw new Error('INVALID_CARD_MOTION');
			}
		}
		return {
			id: raw.id,
			content: raw.content as CardContent,
			style: validateCardStyle(raw.style),
			...(raw.parent !== undefined ? { parent: raw.parent as string } : {}),
			...(raw.landscape !== undefined ? { landscape: validateCardStyle(raw.landscape) } : {}),
			...(raw.compact !== undefined ? { compact: validateCardStyle(raw.compact) } : {}),
			...(motion ? { motion } : {})
		};
	});
	for (const layer of layers) {
		const visited = new Set([layer.id]);
		let parent = layer.parent;
		while (parent) {
			const target = layers.find((l) => l.id === parent);
			if (!target || target.content !== 'group' || visited.has(parent) || visited.size > 8)
				throw new Error('INVALID_CARD_PARENT');
			visited.add(parent);
			parent = target.parent;
		}
	}
	for (const content of ['image', 'title', 'collection', 'logo'] as const)
		if (layers.filter((l) => l.content === content).length !== 1)
			throw new Error('MISSING_CARD_CONTENT');
	return {
		version: 1,
		orientation: value.orientation as CardBlueprint['orientation'],
		portrait: ratio(value.portrait),
		landscape: ratio(value.landscape),
		style: validateCardStyle(value.style),
		...(value.landscapeStyle ? { landscapeStyle: validateCardStyle(value.landscapeStyle) } : {}),
		...(value.compactStyle ? { compactStyle: validateCardStyle(value.compactStyle) } : {}),
		layers
	};
}
