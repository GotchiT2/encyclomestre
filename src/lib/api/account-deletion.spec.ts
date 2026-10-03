import { describe, it, expect, vi, beforeEach } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('./client', async (original) => ({
	...(await original<typeof import('./client')>()),
	apiRequest: request
}));
import { ApiError } from './client';
import { deleteAccount, checkDeletion, getDeletionPreview } from './account-deletion';
describe('account closure contract', () => {
	beforeEach(() => request.mockReset());
	it('sends only the reauthentication and frozen bearer, without refresh or replay', async () => {
		await deleteAccount({ recoveryCode: 'secret' }, 'original-token');
		expect(request).toHaveBeenCalledExactlyOnceWith('/me', {
			skipAuth: true,
			headers: { authorization: 'Bearer original-token' },
			method: 'DELETE',
			body: { recoveryCode: 'secret' }
		});
	});
	it('diagnoses uncertain writes with the same token, without another delete', async () => {
		request.mockRejectedValueOnce(new ApiError(401, { error: 'INVALID_CREDENTIALS' }));
		expect(await checkDeletion('token')).toBe('deleted');
		request.mockResolvedValueOnce({ id: 1 });
		expect(await checkDeletion('token')).toBe('present');
		request.mockRejectedValueOnce(new TypeError('network'));
		expect(await checkDeletion('token')).toBe('unknown');
		expect(
			request.mock.calls.every(
				([path, options]) => path === '/me' && !options.method && options.skipAuth
			)
		).toBe(true);
	});
	it('reads the consequences without writing', async () => {
		await getDeletionPreview();
		expect(request).toHaveBeenCalledWith('/me/deletion', undefined);
	});
});
