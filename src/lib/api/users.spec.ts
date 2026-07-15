import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('./client', () => ({ apiRequest }));

import { searchUsers } from './users';

describe('searchUsers', () => {
	beforeEach(() => apiRequest.mockReset());

	it('forwards the debounced text query without loading the full directory', async () => {
		apiRequest.mockResolvedValueOnce({ results: [], page: 0, nbResults: 0, size: 20 });

		await searchUsers('marie');

		expect(apiRequest).toHaveBeenCalledWith(
			'/api/users?excludeCurrent=true&page=0&size=20&q=marie',
			undefined
		);
	});
});
