import { describe, it, expect } from 'vitest';
import { cardDefinition, cardBlueprint, effectPresets, adaptPresentation } from './card-presets';
import { validateBlueprint, validateCardStyle, MAX_RENDER_KEY } from './blueprint';
import { parseRenderKey, serializeRenderKey } from './render-key';
import { presetDefinition, landscapeFor } from './definition';
describe('complete card renderKey', () => {
	it.each(effectPresets)('roundtrips independently editable %s layers and keyframes', (effect) => {
		const definition = cardDefinition(true, effect),
			raw = serializeRenderKey(definition);
		expect(parseRenderKey(raw)).toEqual(definition);
		if (effect !== 'none') {
			const changed = parseRenderKey(raw)!;
			changed.presentation!.layers.find((l) => l.id === 'shine')!.motion!.frames[1].opacity = '.75';
			expect(
				parseRenderKey(serializeRenderKey(changed))!.presentation!.layers.find(
					(l) => l.id === 'shine'
				)!.motion!.frames[1].opacity
			).toBe('.75');
			expect(
				definition.presentation!.layers.find((l) => l.id === 'shine')!.motion!.frames[1].opacity
			).toBe('.35');
		}
	});
	it('preserves a legacy definition while adapting its framing and does not require an endpoint', () => {
		const legacy = presetDefinition('space'),
			before = JSON.stringify(legacy);
		const adapted = adaptPresentation(legacy, true);
		expect(adapted.layers.find((l) => l.content === 'logo')!.style.bottom).toBe('4cqw');
		expect(JSON.stringify(legacy)).toBe(before);
		expect(parseRenderKey(JSON.stringify(legacy))).toEqual(legacy);
		expect(parseRenderKey('tpl:space@1')).toBeNull();
		expect(parseRenderKey('standard')).toBeNull();
	});
	it('normal cards reserve a description and omit numbering', () => {
		const blueprint = cardBlueprint(false);
		expect(blueprint.layers.some((l) => l.content === 'description')).toBe(true);
		expect(blueprint.layers.some((l) => l.content === 'serial')).toBe(false);
		expect(blueprint.orientation).toBe('portrait');
	});
	it('uses any wider full-art image as landscape and squares as portrait', () => {
		expect(landscapeFor('auto', true, 1100, 1000)).toBe(true);
		expect(landscapeFor('auto', true, 1000, 1000)).toBe(false);
		expect(landscapeFor('auto', false, 2000, 1000)).toBe(false);
	});
	it.each([
		'background:url(https://evil.test)',
		'position:fixed',
		'background:image-set(https://evil.test)',
		'color:var(--external)',
		'color:red;position:fixed'
	])('rejects non-owned or resource-bearing styles: %s', (entry) => {
		const split = entry.indexOf(':');
		expect(() => validateCardStyle({ [entry.slice(0, split)]: entry.slice(split + 1) })).toThrow();
	});
	it('rejects cyclic, duplicate or missing layers, excessive input and unsupported motion', () => {
		const p = cardBlueprint(true);
		p.layers.find((l) => l.id === 'caption')!.parent = 'metadata';
		expect(() => validateBlueprint(p)).toThrow('INVALID_CARD_PARENT');
		const duplicate = cardBlueprint(true);
		duplicate.layers.push({ ...duplicate.layers[0] });
		expect(() => validateBlueprint(duplicate)).toThrow();
		const missing = cardBlueprint(true);
		missing.layers = missing.layers.filter((l) => l.content !== 'logo');
		expect(() => validateBlueprint(missing)).toThrow();
		expect(() => parseRenderKey('{' + ' '.repeat(MAX_RENDER_KEY))).toThrow(
			'CARD_TEMPLATE_TOO_LARGE'
		);
		const bad = cardDefinition(true, 'chrome');
		bad.presentation!.layers.find((l) => l.id === 'shine')!.motion!.duration = Infinity;
		expect(() => serializeRenderKey(bad)).toThrow();
	});
});
