export type AchievementCategory =
	| 'COLLECTION'
	| 'BOOSTER'
	| 'TRADE'
	| 'SALE'
	| 'SOCIAL'
	| 'MONEY'
	| (string & {});

export type AchievementState = 'LOCKED' | 'CLAIMABLE' | 'DONE';

export interface Achievement {
	code: string;
	category: AchievementCategory;
	name: string;
	description?: string;
	threshold: number;
	progress: number;
	rewardMoney: number;
	rewardBoosters?: Partial<Record<string, number>>;
	unlockedAt?: string;
	claimedAt?: string;
}

export function achievementState(achievement: Achievement): AchievementState {
	return achievement.claimedAt ? 'DONE' : achievement.unlockedAt ? 'CLAIMABLE' : 'LOCKED';
}

export function achievementClaimableCount(achievements: Achievement[]) {
	return achievements.filter((achievement) => achievementState(achievement) === 'CLAIMABLE').length;
}
