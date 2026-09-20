import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('./client', () => ({ apiRequest }));

import { claimAchievement, getAchievements } from './achievements';
import { achievementClaimableCount, achievementState } from '$lib/types';

describe('WikiForge achievements', () => {
	beforeEach(() => apiRequest.mockReset());

	it('loads the complete ordered list and maps optional reward dates as UTC', async () => {
		apiRequest.mockResolvedValueOnce([
			{
				code: 'boosters_100',
				category: 'BOOSTER',
				name: 'Habitué du kiosque',
				threshold: 100,
				progress: 100,
				rewardMoney: 0,
				rewardBoosters: { PREMIUM: 1 },
				unlockedAt: '2026-09-14T18:22:31'
			}
		]);

		await expect(getAchievements()).resolves.toEqual([
			expect.objectContaining({
				code: 'boosters_100',
				rewardBoosters: { PREMIUM: 1 },
				unlockedAt: '2026-09-14T18:22:31.000Z'
			})
		]);
		expect(apiRequest).toHaveBeenCalledWith('/me/achievements', { apiTarget: 'wikiforge' });
	});

	it('claims by stable code without a request body', async () => {
		apiRequest.mockResolvedValueOnce(undefined);
		await claimAchievement('boosters_100');
		expect(apiRequest).toHaveBeenCalledWith('/me/achievements/boosters_100/claim', {
			apiTarget: 'wikiforge',
			method: 'POST'
		});
	});

	it('derives the three states from timestamps, never progress', () => {
		const achievements = [
			{ code: 'a', category: 'COLLECTION', name: 'A', threshold: 10, progress: 10, rewardMoney: 0 },
			{
				code: 'b',
				category: 'COLLECTION',
				name: 'B',
				threshold: 10,
				progress: 1,
				rewardMoney: 0,
				unlockedAt: '2026-09-01T00:00:00.000Z'
			},
			{
				code: 'c',
				category: 'COLLECTION',
				name: 'C',
				threshold: 10,
				progress: 10,
				rewardMoney: 0,
				unlockedAt: '2026-09-01T00:00:00.000Z',
				claimedAt: '2026-09-01T00:01:00.000Z'
			}
		] as const;

		expect(achievements.map(achievementState)).toEqual(['LOCKED', 'CLAIMABLE', 'DONE']);
		expect(achievementClaimableCount([...achievements])).toBe(1);
	});
});
