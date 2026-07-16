import type { User } from './user';

export type FriendshipStatus = 'received' | 'sent' | 'accepted' | 'rejected';

export interface Friendship {
	id: string;
	user: User;
	status: FriendshipStatus;
	createdAt: string;
	lastActiveAt: string;
}
