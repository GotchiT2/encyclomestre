import type { User } from './user';

export type FriendshipStatus = 'received' | 'sent' | 'accepted' | 'rejected';

export interface Friendship {
	id: string;
	user: User;
	status: FriendshipStatus;
	createdAt: string;
	lastActiveAt: string;
}

export interface UserBlock {
	user: User;
	createdAt: string;
}

export type PlayerRelationshipStatus = 'friend' | 'pending' | 'blocked' | 'none';

export interface PlayerRelationship {
	status: PlayerRelationshipStatus;
	friendshipId?: string;
}
