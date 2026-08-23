import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import {
	applyWikiForgeTag,
	createWikiForgeTag,
	deleteWikiForgeTag,
	getWikiForgeTags,
	removeWikiForgeTag,
	updateWikiForgeTag
} from './wikiforge';

const request = vi.mocked(apiRequest);

beforeEach(() => request.mockReset());

describe('WikiForge tag API', () => {
	it('maps numeric tag identifiers at the frontend boundary', async () => {
		request.mockResolvedValue([{ id: 2, name: 'Favori', color: '#feb823' }]);
		await expect(getWikiForgeTags()).resolves.toEqual([
			{ id: '2', name: 'Favori', color: '#feb823' }
		]);
		expect(request).toHaveBeenCalledWith('/tags', { apiTarget: 'wikiforge' });
	});

	it('uses POST, PATCH and DELETE on the canonical tag paths', async () => {
		request
			.mockResolvedValueOnce({ id: 3, name: 'Neuve', color: '#abcdef' })
			.mockResolvedValueOnce({ id: 3, name: 'Modifiée', color: '#123456' })
			.mockResolvedValueOnce(undefined);

		await createWikiForgeTag({ name: 'Neuve', color: '#abcdef' });
		await updateWikiForgeTag('3', { name: 'Modifiée', color: '#123456' });
		await deleteWikiForgeTag('3');

		expect(request).toHaveBeenNthCalledWith(1, '/tags', {
			apiTarget: 'wikiforge',
			method: 'POST',
			body: { name: 'Neuve', color: '#abcdef' }
		});
		expect(request).toHaveBeenNthCalledWith(2, '/tags/3', {
			apiTarget: 'wikiforge',
			method: 'PATCH',
			body: { name: 'Modifiée', color: '#123456' }
		});
		expect(request).toHaveBeenNthCalledWith(3, '/tags/3', {
			apiTarget: 'wikiforge',
			method: 'DELETE'
		});
	});

	it('sends numeric card arrays to bulk PUT and DELETE endpoints', async () => {
		request.mockResolvedValue([]);
		await applyWikiForgeTag('2', ['81', '82']);
		await removeWikiForgeTag('2', ['81', '82']);

		expect(request).toHaveBeenNthCalledWith(1, '/collection/tags/2', {
			apiTarget: 'wikiforge',
			method: 'PUT',
			body: [81, 82]
		});
		expect(request).toHaveBeenNthCalledWith(2, '/collection/tags/2', {
			apiTarget: 'wikiforge',
			method: 'DELETE',
			body: [81, 82]
		});
	});
});
