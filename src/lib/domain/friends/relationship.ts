import type { Friendship, PlayerRelationship, UserBlock } from '$lib/types';

export function getPlayerRelationship(
	userId: string,
	friendships: Friendship[],
	blocks: UserBlock[]
): PlayerRelationship {
	if (blocks.some((block) => block.user.id === userId)) return { status: 'blocked' };

	const friendship = friendships.find(
		(entry) => entry.user.id === userId && entry.status !== 'rejected'
	);
	if (!friendship) return { status: 'none' };

	return {
		status: friendship.status === 'accepted' ? 'friend' : 'pending',
		friendshipId: friendship.id
	};
}
