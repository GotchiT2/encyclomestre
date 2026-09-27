import type { Achievement } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { wikiForgeUtcDate } from './wikiforge-contract';

interface AchievementDto {
	code: string;
	category: string;
	name: string;
	description?: string;
	threshold: number;
	progress: number;
	rewardMoney: number;
	rewardBoosters?: Record<string, number>;
	unlockedAt?: string;
	claimedAt?: string;
}

export function toAchievement(dto: AchievementDto): Achievement {
	return {
		code: dto.code,
		category: dto.category,
		name: dto.name,
		...(dto.description ? { description: dto.description } : {}),
		threshold: dto.threshold,
		progress: dto.progress,
		rewardMoney: dto.rewardMoney,
		...(dto.rewardBoosters ? { rewardBoosters: dto.rewardBoosters } : {}),
		...(dto.unlockedAt ? { unlockedAt: wikiForgeUtcDate(dto.unlockedAt).toISOString() } : {}),
		...(dto.claimedAt ? { claimedAt: wikiForgeUtcDate(dto.claimedAt).toISOString() } : {})
	};
}

export async function getAchievements(options?: RequestOptions): Promise<Achievement[]> {
	return (
		await apiRequest<AchievementDto[]>('/me/achievements', { ...options, apiTarget: 'wikiforge' })
	).map(toAchievement);
}

export const claimAchievement = (code: string, options?: RequestOptions) =>
	apiRequest<void>(`/me/achievements/${encodeURIComponent(code)}/claim`, {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST'
	});

export const claimAllAchievements = (options?: RequestOptions) =>
	apiRequest<import('./schema').ApiSchemas['ClaimedAchievementsDTO']>('/me/achievements/claim', {
		...options,
		method: 'POST'
	});
