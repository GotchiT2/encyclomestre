import type { MessageRecord } from '$lib/types';

export function reactionMenuAlignment(senderId: string, currentUserId: string) {
	return senderId === currentUserId ? 'right-0' : 'left-0';
}

export function updateMessageReaction(
	messages: MessageRecord[],
	messageId: string,
	emoji: string,
	userId: string,
	active: boolean
) {
	return messages.map((message) => {
		if (message.id !== messageId) return message;
		const current = message.reactions.find((reaction) => reaction.emoji === emoji);
		const reactions = message.reactions
			.map((reaction) =>
				reaction.emoji === emoji
					? {
							...reaction,
							userIds: active
								? [...new Set([...reaction.userIds, userId])]
								: reaction.userIds.filter((id) => id !== userId)
						}
					: reaction
			)
			.filter((reaction) => reaction.userIds.length > 0);
		if (!current && active) reactions.push({ emoji, userIds: [userId] });
		return { ...message, reactions };
	});
}
