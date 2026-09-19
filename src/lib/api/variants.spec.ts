import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('./client', () => ({ apiRequest }));

import { defaultPageVariant, getVariants, resetVariantsCache, standardVariant } from './variants';

describe('variant catalogue', () => {
	beforeEach(() => {
		resetVariantsCache();
		apiRequest.mockReset();
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
