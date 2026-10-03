import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('./client', () => ({ apiRequest }));

import { defaultPageVariant, getVariants, resetVariantsCache, standardVariant } from './variants';
import { cardDefinition } from '$lib/card-renderer/card-presets';
import { serializeRenderKey } from '$lib/card-renderer/render-key';

describe('variant catalogue', () => {
	beforeEach(() => {
		resetVariantsCache();
		apiRequest.mockReset();
	});
	it('keeps complete JSON and its casing exactly as provided by the catalogue', async () => {
		const key = serializeRenderKey(cardDefinition(false));
		apiRequest.mockResolvedValue([
			{ id: 9, name: 'Atelier', color: '#E8EF42', styles: ['NORMAL'], renderKey: key }
		]);
		const variants = await getVariants();
		expect(variants[0].renderKey).toBe(key);
		expect(variants[0].renderKey).toContain('Barlow Condensed');
	});

	it('loads once, keeps unknown styles and falls back for an unknown render key', async () => {
		apiRequest.mockResolvedValue([
			{ id: 7, name: 'Future', color: '#123456', styles: ['NORMAL', 'FUTURE'], renderKey: 'future' }
		]);
		const [first, second] = await Promise.all([getVariants(), getVariants()]);
		expect(apiRequest).toHaveBeenCalledTimes(1);
		expect(first).toBe(second);
		expect(first[0]).toMatchObject({ styles: ['NORMAL', 'FUTURE'], renderKey: 'standard' });
	});

	it('uses the first NORMAL variant then the synthetic Standard fallback', () => {
		const normal = { ...standardVariant, id: 8 };
		expect(defaultPageVariant([normal]).id).toBe(8);
		expect(defaultPageVariant([])).toEqual(standardVariant);
	});
});
