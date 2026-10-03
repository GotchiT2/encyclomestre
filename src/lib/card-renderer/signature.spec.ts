import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import rose from './templates/prestige-rose-champagne.json';
import karina from './templates/prestige-karina-platinum.json';
import { validateSignature, validateBlueprint } from './blueprint';
import { validateDefinition, ENGINE_VERSION, presetDefinition } from './definition';
import { parseRenderKey, serializeRenderKey } from './render-key';
import { cardDefinition } from './card-presets';

describe('Prestige vector signatures', () => {
	it.each([
		['prestige-rose-champagne', rose],
		['prestige-karina-platinum', karina]
	] as const)('ships the same %s definition as the native renderer', (name, source) => {
		expect(
			JSON.parse(
				readFileSync(
					new URL('../../../static/cards/templates/v4/' + name + '.json', import.meta.url),
					'utf8'
				)
			)
		).toEqual(source);
	});
	it.each([rose, karina])(
		'preserves the complete signed template across import/export',
		(source) => {
			const definition = validateDefinition(source);
			expect(ENGINE_VERSION).toBe(4);
			expect(parseRenderKey(serializeRenderKey(definition))).toEqual(definition);
			expect(
				definition.presentation!.layers.find((layer) => layer.content === 'signature')!.signature
			).toEqual(
				source.presentation.layers.find((layer) => layer.content === 'signature')!.signature
			);
		}
	);
	it('requires engine 4 for signed layers without changing legacy formats', () => {
		expect(() => validateDefinition({ ...rose, schemaVersion: 3, minEngineVersion: 3 })).toThrow(
			'UNSUPPORTED_TEMPLATE_VERSION'
		);
		expect(() => validateDefinition({ ...rose, minEngineVersion: 3 })).toThrow(
			'UNSUPPORTED_TEMPLATE_VERSION'
		);
		const old = presetDefinition('classic');
		expect(
			validateDefinition({ ...old, schemaVersion: 1, minEngineVersion: 1 }).schemaVersion
		).toBe(2);
		expect(parseRenderKey(serializeRenderKey(old))).toEqual(old);
		expect(parseRenderKey(serializeRenderKey(cardDefinition(true)))).toEqual(cardDefinition(true));
		expect(parseRenderKey('signature')).toBeNull();
	});
	it('supports unsigned Prestige without reserving a signature placeholder', () => {
		const unsigned = structuredClone(rose);
		unsigned.presentation.layers = unsigned.presentation.layers.filter(
			(layer) => layer.content !== 'signature'
		);
		expect(
			validateDefinition(unsigned).presentation!.layers.some(
				(layer) => layer.content === 'signature'
			)
		).toBe(false);
	});
	it.each([
		{ viewBox: [0, 0, 0, 10], paths: ['M0 0L1 1'] },
		{ viewBox: [0, 0, 10, NaN], paths: ['M0 0L1 1'] },
		{ viewBox: [0, 0, 10, 10], paths: [] },
		{ viewBox: [0, 0, 10, 10], paths: Array(17).fill('M0 0L1 1') },
		{ viewBox: [0, 0, 10, 10], paths: ['<path onload="alert(1)"/>'] },
		{ viewBox: [0, 0, 10, 10], paths: ['M0 0L1'] },
		{ viewBox: [0, 0, 10, 10], paths: ['M0 0L1e999 1'] },
		{ viewBox: [0, 0, 10, 10], paths: ['M0 0Z1'] },
		{ viewBox: [0, 0, 10, 10], paths: [','] },
		{ viewBox: [0, 0, 10, 10], paths: ['M0 0'], transform: [1, 0, 0, 1, Infinity, 0] },
		{ viewBox: [0, 0, 10, 10], paths: ['M0 0'], href: 'https://external.test/signature.svg' }
	])('rejects invalid or resource-bearing vector data %#', (value) => {
		expect(() => validateSignature(value)).toThrow('INVALID_CARD_SIGNATURE');
	});
	it('rejects duplicate signatures and signature data on another content', () => {
		const p = validateDefinition(rose).presentation!;
		const signature = p.layers.find((layer) => layer.content === 'signature')!;
		expect(() =>
			validateBlueprint({ ...p, layers: [...p.layers, { ...signature, id: 'second-signature' }] })
		).toThrow('INVALID_CARD_SIGNATURE');
		expect(() =>
			validateBlueprint({
				...p,
				layers: p.layers.map((layer) =>
					layer.id === signature.id ? { ...layer, content: 'decoration' } : layer
				)
			})
		).toThrow('INVALID_CARD_SIGNATURE');
	});
});
