import { describe, it, expect } from 'vitest';
import { ApiError } from '$lib/api/client';
import { nameChangeLocked, nameChangeRefusal } from './name-change';
import { toCurrentUser } from '$lib/api/current-user';
describe('name cooldown', () => {
	const available = '2026-09-29T16:58:30.248390Z';
	it('unlocks at the exact UTC date and handles absent or invalid dates', () => {
		expect(nameChangeLocked(available, Date.parse(available) - 1)).toBe(true);
		expect(nameChangeLocked(available, Date.parse(available))).toBe(false);
		expect(nameChangeLocked(undefined)).toBe(false);
		expect(nameChangeLocked('invalid')).toBe(false);
	});
	it('reads error rather than message and preserves the profile field', () => {
		expect(
			nameChangeRefusal(
				new ApiError(429, { error: 'NAME_CHANGE_TOO_SOON', meta: { availableAt: available } })
			)
		).toBe(available);
		expect(
			nameChangeRefusal(
				new ApiError(429, { message: 'NAME_CHANGE_TOO_SOON', meta: { availableAt: available } })
			)
		).toBe(null);
		const dto = {
			id: 1,
			name: 'Alice',
			email: 'a@example.org',
			roles: ['USER'],
			createdAt: '2026-09-01T12:00:00Z',
			nameChangeAvailableAt: available
		};
		expect(toCurrentUser(dto).nameChangeAvailableAt).toBe(available);
		expect(
			toCurrentUser({ ...dto, nameChangeAvailableAt: undefined, roles: ['ADMIN'] })
				.nameChangeAvailableAt
		).toBeUndefined();
	});
});
