import { presetDefinition } from './definition';

/** Presentation only: never mutates a stored or published definition. */
export function variantDefinition(color: string, chrome: boolean) {
	const value = presetDefinition('classic');
	value.visual.color = color;
	value.visual.model = chrome ? 'chrome' : 'base';
	value.visual.fontSize = 8;
	value.layout!.zones.frame.background = '#171918';
	value.layout!.zones.title.background = '#EFEBD9';
	value.layout!.zones.title.css = 'color:#171918';
	value.layout!.frameFinish = {
		...value.layout!.frameFinish,
		type: chrome ? 'metallic' : 'none',
		motion: 'pointer',
		color
	};
	return value;
}
