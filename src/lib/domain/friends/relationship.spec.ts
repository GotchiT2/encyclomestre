import { describe, expect, it } from 'vitest';
import type { Friendship, User, UserBlock } from '$lib/types';
import { getPlayerRelationship } from './relationship';

const user = { id: 'player-1' } as User;
const friendship = (status: Friendship['status']): Friendship => ({
	id: 'friendship-1',
	user,
	status,
	createdAt: '',
	lastActiveAt: ''
});

describe('getPlayerRelationship', () => {
	it.each([
		['accepted', 'friend'],
		['received', 'pending'],
		['sent', 'pending']
	] as const)('maps %s friendships to %s', (friendshipStatus, relationshipStatus) => {
		expect(getPlayerRelationship(user.id, [friendship(friendshipStatus)], [])).toEqual({
			status: relationshipStatus,
			friendshipId: friendship('accepted').id
		});
	});

	it('gives a block priority over an existing friendship', () => {
		const blocks: UserBlock[] = [{ user, createdAt: '' }];
		expect(getPlayerRelationship(user.id, [friendship('accepted')], blocks)).toEqual({
			status: 'blocked'
		});
	});

	it('treats rejected and unknown players as unrelated', () => {
		expect(getPlayerRelationship(user.id, [friendship('rejected')], [])).toEqual({
			status: 'none'
		});
	});
});
