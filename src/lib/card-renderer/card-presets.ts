import { presetDefinition, type TemplateDefinition } from './definition';
import { validateBlueprint, type CardBlueprint, type CardLayer, type CardStyle } from './blueprint';
export const compositions = ['atelier', 'full-art'] as const;
export const effectPresets = [
	'none',
	'chrome',
	'prism',
	'orbit',
	'impact',
	'circuit',
	'eclipse'
] as const;
export type CardEffect = (typeof effectPresets)[number];
const cut = 'polygon(3% 0,97% 0,100% 3%,100% 97%,97% 100%,3% 100%,0 97%,0 3%)';
const layer = (
	id: string,
	content: CardLayer['content'],
	style: CardStyle,
	parent?: string
): CardLayer => ({ id, content, style, ...(parent ? { parent } : {}) });
/** Presets are explicit editable layers and keyframes; the renderer never looks at a preset name. */
export function cardBlueprint(fullArt: boolean, effect: CardEffect = 'none'): CardBlueprint {
	const title = {
		color: fullArt ? '#EFEBD9' : '#171918',
		'font-family': "'Barlow Condensed',sans-serif",
		'font-weight': '800',
		'font-size': fullArt ? 'clamp(11px,7.1cqw,30px)' : 'clamp(11px,9.5cqw,38px)',
		'line-height': '1.02',
		'overflow-wrap': 'anywhere',
		'min-width': '0',
		'text-align': 'left',
		'-webkit-line-clamp': '4'
	};
	const blueprint: CardBlueprint = {
		version: 1,
		orientation: fullArt ? 'auto' : 'portrait',
		portrait: '5 / 7',
		landscape: '7 / 5',
		style: {
			background: fullArt ? '#171918' : '#EFEBD9',
			color: fullArt ? '#EFEBD9' : '#171918',
			'font-family': "'Barlow',sans-serif",
			'font-size': 'clamp(9px,4cqw,18px)',
			border: fullArt ? '.65cqw solid #EFEBD9' : '.7cqw solid #EFEBD9',
			'clip-path': cut,
			display: 'flex',
			'flex-direction': 'column',
			padding: fullArt ? '0' : '2.8cqw',
			gap: fullArt ? '0' : '1.5cqw'
		},
		layers: fullArt
			? [
					layer('image', 'image', {
						position: 'absolute',
						inset: '0',
						'object-fit': 'cover',
						'object-position': '50% 35%'
					}),
					layer('contrast', 'decoration', {
						position: 'absolute',
						inset: '0',
						background: 'linear-gradient(0deg,#171918ed,transparent 32%)'
					}),
					layer('caption', 'group', {
						position: 'absolute',
						left: '4cqw',
						right: '18cqw',
						bottom: '4cqw',
						display: 'flex',
						'flex-direction': 'column',
						gap: '1.5cqw',
						'z-index': '3'
					}),
					layer('title', 'title', title, 'caption'),
					layer(
						'metadata',
						'group',
						{ display: 'flex', 'flex-wrap': 'wrap', gap: '1cqw 2cqw', 'align-items': 'baseline' },
						'caption'
					),
					layer(
						'collection',
						'collection',
						{
							'font-family': "'Barlow',sans-serif",
							'font-size': 'clamp(7px,2.8cqw,11px)',
							'font-weight': '500',
							'letter-spacing': '.08em',
							opacity: '.85',
							'overflow-wrap': 'anywhere'
						},
						'metadata'
					),
					layer(
						'serial',
						'serial',
						{
							'font-family': "'Barlow',sans-serif",
							'font-size': 'clamp(7px,2.8cqw,11px)',
							opacity: '.8'
						},
						'metadata'
					),
					layer('logo', 'logo', {
						position: 'absolute',
						right: '4cqw',
						bottom: '4cqw',
						width: '10cqw',
						height: '14cqw',
						color: '#E8EF42',
						'z-index': '4'
					})
				]
			: [
					layer('image', 'image', {
						height: '87cqw',
						flex: '0 0 auto',
						'object-fit': 'cover',
						'object-position': '50% 35%',
						'clip-path': 'polygon(0 0,100% 0,100% 96%,96% 100%,0 100%)'
					}),
					layer('title', 'title', {
						...title,
						background: '#E8EF42',
						padding: '1cqw 2cqw',
						flex: '0 0 auto',
						'clip-path': 'polygon(0 0,100% 0,96% 100%,0 100%)'
					}),
					layer('description', 'description', {
						flex: '1 1 0',
						'min-height': '0',
						'font-family': "'Barlow',sans-serif",
						'font-size': 'clamp(9px,3.8cqw,17px)',
						'line-height': '1.2'
					}),
					layer('footer', 'group', {
						flex: '0 0 auto',
						height: '7cqw',
						display: 'flex',
						'align-items': 'center',
						'justify-content': 'flex-end',
						gap: '2cqw'
					}),
					layer(
						'printer-mark',
						'decoration',
						{
							'margin-inline': '0 auto',
							width: '15cqw',
							height: '1.7cqw',
							background:
								'linear-gradient(110deg,#E8EF42 0 34%,#171918 34% 66%,#E8EF42 66% 69%,transparent 69%)'
						},
						'footer'
					),
					layer(
						'collection',
						'collection',
						{
							'font-family': "'Barlow',sans-serif",
							'font-size': 'clamp(8px,2.5cqw,10px)',
							'letter-spacing': '.05em',
							'text-align': 'right',
							'min-width': '0'
						},
						'footer'
					),
					layer(
						'logo',
						'logo',
						{ width: '5.5cqw', height: '7cqw', color: '#171918', flex: '0 0 auto' },
						'footer'
					),
					layer('corner', 'decoration', {
						position: 'absolute',
						top: '0',
						right: '0',
						width: '9cqw',
						height: '9cqw',
						background: '#E8EF42',
						'clip-path': 'polygon(0 0,100% 0,100% 100%)'
					})
				]
	};
	const illustration = blueprint.layers.find((l) => l.content === 'image')!;
	Object.assign(illustration.style, {
		background: '#242723',
		color: '#EFEBD9',
		'font-size': 'clamp(9px,4cqw,18px)'
	});
	if (fullArt) {
		blueprint.layers.find((l) => l.id === 'title')!.landscape = {
			'font-size': 'clamp(10px,5.5cqw,25px)',
			'-webkit-line-clamp': '3'
		};
		blueprint.layers.find((l) => l.id === 'contrast')!.landscape = {
			background: 'linear-gradient(0deg,#171918f2,transparent 46%)'
		};
	}
	// Nested transparent centre: effects decorate the rim, not the photograph.
	const gradients: Partial<Record<CardEffect, string>> = {
		chrome:
			'linear-gradient(130deg,#fafbf6,#77848b 20%,#eef1e9 42%,#536168 60%,#fffde9 84%,#a5b2b8) border-box',
		prism: 'conic-gradient(from 30deg,#f695e3,#8b7cff,#6cecff,#bafa9d,#ffc875,#f695e3) border-box',
		impact:
			'repeating-linear-gradient(125deg,#E8EF42 0 6cqw,#171918 6cqw 9cqw,#fa6040 9cqw 11cqw) border-box',
		circuit: 'linear-gradient(130deg,#6cecff,#171918 35%,#E8EF42 60%,#6cecff) border-box',
		eclipse: 'linear-gradient(135deg,#ef996b,#d95ce2 45%,#171918 65%,#fc89d0) border-box'
	};
	if (gradients[effect]) {
		// A rim is drawn with four explicit, independently editable gradient strips.
		const background = gradients[effect]!.replace(' border-box', '');
		const strips: Record<string, CardStyle> = {
			top: { top: '0', left: '0', right: '0', height: '1.3cqw' },
			bottom: { bottom: '0', left: '0', right: '0', height: '1.3cqw' },
			left: { top: '0', bottom: '0', left: '0', width: '1.3cqw' },
			right: { top: '0', bottom: '0', right: '0', width: '1.3cqw' }
		};
		for (const [id, style] of Object.entries(strips))
			blueprint.layers.push(
				layer('rim-' + id, 'decoration', {
					position: 'absolute',
					...style,
					background,
					'z-index': '2'
				})
			);
	}
	if (effect === 'orbit')
		blueprint.layers.push(
			layer('orbit', 'decoration', {
				position: 'absolute',
				inset: '1.5cqw',
				border: '.5cqw solid #6cecff',
				'border-radius': '48%',
				transform: 'rotate(-12deg)',
				'box-shadow': 'inset 0 0 2cqw #6cecff44',
				'z-index': '2'
			})
		);
	if (effect === 'circuit')
		blueprint.layers.push(
			layer('circuit-lines', 'decoration', {
				position: 'absolute',
				inset: '2cqw',
				background:
					'linear-gradient(90deg,transparent 93%,#E8EF42 93% 94%,transparent 94%),linear-gradient(0deg,transparent 97%,#6cecff 97% 98%,transparent 98%)',
				'z-index': '2'
			})
		);
	if (effect !== 'none') {
		const shine = layer('shine', 'decoration', {
			position: 'absolute',
			inset: '0',
			background: 'linear-gradient(115deg,transparent 35%,#ffffff44 48%,transparent 60%)',
			opacity: '.12',
			'background-size': '250% 100%',
			'background-position': '50% 0',
			'mix-blend-mode': 'screen',
			'z-index': '2'
		});
		shine.motion = {
			trigger: 'pointer',
			duration: 650,
			easing: 'ease-out',
			loop: false,
			frames: [
				{ 'background-position': '0% 0', opacity: '.1' },
				{ 'background-position': '100% 0', opacity: '.35' }
			]
		};
		blueprint.layers.push(shine);
	}
	return validateBlueprint(blueprint);
}
export function cardDefinition(fullArt: boolean, effect: CardEffect = 'none'): TemplateDefinition {
	const definition = presetDefinition('classic');
	return {
		...definition,
		schemaVersion: 3,
		minEngineVersion: 3,
		presentation: cardBlueprint(fullArt, effect)
	};
}
export function adaptPresentation(definition: TemplateDefinition, fullArt: boolean): CardBlueprint {
	if (definition.presentation) return definition.presentation;
	const type = definition.layout?.frameFinish.type ?? definition.design.foil;
	const effect: CardEffect =
		type === 'metallic' || definition.visual.model === 'chrome'
			? 'chrome'
			: type === 'prismatic' || type === 'holographic'
				? 'prism'
				: type === 'neon'
					? 'circuit'
					: 'none';
	const blueprint = cardBlueprint(fullArt, effect);
	blueprint.orientation = fullArt ? definition.design.orientation : 'portrait';
	const image = blueprint.layers.find((l) => l.content === 'image')!;
	image.style['object-fit'] = definition.visual.fit;
	image.style['object-position'] = `${definition.visual.x}% ${definition.visual.y}%`;
	return blueprint;
}
