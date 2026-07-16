<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { reactionMenuAlignment } from '$lib/messages/reactions';
	import { cn } from '$lib/utils';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { Conversation, MessageRecord } from '$lib/types';

	let {
		conversation,
		thread,
		userId,
		loading = false,
		sending = false,
		draft = $bindable(''),
		replyToMessageId = $bindable<string | null>(null),
		onClose,
		onSubmit,
		onReact
	}: {
		conversation: Conversation;
		thread: MessageRecord[];
		userId: string;
		loading?: boolean;
		sending?: boolean;
		draft?: string;
		replyToMessageId?: string | null;
		onClose?: () => void;
		onSubmit: () => void;
		onReact: (message: MessageRecord, emoji: string) => void;
	} = $props();

	const reactionEmojis = ['👍', '❤️', '😂', '😮', '🎉'];
	function quotedMessage(message: MessageRecord) {
		return message.replyToMessageId
			? (thread.find((candidate) => candidate.id === message.replyToMessageId) ?? null)
			: null;
	}
</script>

<section class="flex h-full min-h-0 min-w-0 flex-col bg-card" data-testid="message-thread">
	<header
		class="flex min-h-16 shrink-0 items-center gap-2 border-b border-primary/20 bg-card/95 px-3 py-2 backdrop-blur-sm sm:px-4"
	>
		{#if onClose}
			<Button
				size="icon"
				variant="ghost"
				onclick={onClose}
				aria-label={$_('messages.back_to_conversations')}
			>
				<ArrowLeftIcon />
			</Button>
		{/if}
		<div class="min-w-0">
			<p class="font-mono text-[8px] uppercase tracking-widest text-primary">
				{conversation.kind === 'guild'
					? $_('messages.guild_channel')
					: $_('messages.direct_channel')}
			</p>
			<h2 class="truncate font-serif text-lg font-bold text-foreground">{conversation.title}</h2>
		</div>
	</header>

	<div
		class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-background/35 p-3 sm:gap-3 sm:p-4"
	>
		{#if loading}
			<p class="m-auto font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('messages.loading')}
			</p>
		{:else}
			{#each thread as message (message.id)}
				{@const quoted = quotedMessage(message)}
				<article
					class="max-w-[86%] border px-3 py-2 shadow-sm {message.senderId === userId
						? 'ml-auto border-primary/45 bg-primary/14'
						: 'mr-auto border-primary/15 bg-card'}"
				>
					{#if quoted}
						<blockquote
							class="mb-2 border-l-2 border-primary/60 pl-2 text-xs text-muted-foreground"
						>
							{quoted.content}
						</blockquote>
					{/if}
					<p class="wrap-break-word text-sm leading-relaxed text-foreground">{message.content}</p>
					{#if message.wishlistShare}
						<div class="mt-2 border border-primary/35 bg-background/60 p-2.5">
							<p class="forge-label">{$_('messages.guild_share')}</p>
							<h3 class="mt-1 font-serif font-bold">{message.wishlistShare.title}</h3>
							<p class="mt-1 text-xs text-muted-foreground">{message.wishlistShare.description}</p>
							<p class="mt-2 font-mono text-[9px] uppercase tracking-widest text-primary">
								{$_('wishlist.total', { values: { count: message.wishlistShare.cardCount } })}
							</p>
							<Button
								href={`/wishlists?registry=${message.wishlistShare.registryId}`}
								size="sm"
								variant="outline"
								class="mt-2"
							>
								{$_('messages.open_share')}
							</Button>
						</div>
					{/if}
					{#if message.tradeOffer}
						<div class="mt-2 border border-primary/40 bg-background/60 p-2.5">
							<p class="forge-label">{$_('messages.trade_offer')}</p>
							<div class="mt-2 grid grid-cols-2 gap-2 font-mono text-[9px] text-primary">
								<p>
									<span class="block text-muted-foreground">{$_('messages.trade_offered')}</span>
									{message.tradeOffer.offeredCardIds.length} · {message.tradeOffer.offeredCredits}
									{$_('messages.trade_credits')}
								</p>
								<p>
									<span class="block text-muted-foreground">{$_('messages.trade_requested')}</span>
									{message.tradeOffer.requestedCardIds.length} · {message.tradeOffer
										.requestedCredits}
									{$_('messages.trade_credits')}
								</p>
							</div>
							<Button
								href={`/trades?offer=${message.tradeOffer.offerId}`}
								size="sm"
								variant="outline"
								class="mt-2"
							>
								{$_('messages.open_trade')}
							</Button>
						</div>
					{/if}
					<div class="mt-2 flex flex-wrap items-center gap-1">
						<Button size="xs" variant="ghost" onclick={() => (replyToMessageId = message.id)}>
							{$_('messages.reply')}
						</Button>
						{#each message.reactions as reaction (reaction.emoji)}
							<Button
								size="xs"
								variant={reaction.userIds.includes(userId) ? 'default' : 'outline'}
								aria-pressed={reaction.userIds.includes(userId)}
								onclick={() => onReact(message, reaction.emoji)}
								>{reaction.emoji} {reaction.userIds.length}</Button
							>
						{/each}
						<details class="relative">
							<summary
								class="grid size-11 cursor-pointer list-none place-items-center border border-primary/40 text-primary"
								aria-label={$_('messages.react')}>+</summary
							>
							<div
								class={cn(
									'absolute bottom-full z-20 mb-1 flex border border-primary/40 bg-card p-1 shadow-xl',
									reactionMenuAlignment(message.senderId, userId)
								)}
							>
								{#each reactionEmojis as emoji (emoji)}
									<Button
										size="icon-xs"
										variant="ghost"
										aria-label={`${$_('messages.react')} ${emoji}`}
										onclick={() => onReact(message, emoji)}>{emoji}</Button
									>
								{/each}
							</div>
						</details>
					</div>
					<time class="mt-1 block text-right font-mono text-[8px] text-muted-foreground">
						{new Date(message.createdAt).toLocaleString('fr-FR')}
					</time>
				</article>
			{/each}
		{/if}
	</div>

	<form
		class="shrink-0 border-t border-primary/20 bg-card p-2.5 sm:p-3"
		onsubmit={(event) => {
			event.preventDefault();
			onSubmit();
		}}
	>
		{#if replyToMessageId}
			<div
				class="mb-2 flex items-center justify-between gap-2 border border-primary/30 bg-background px-2 py-1.5"
			>
				<span class="truncate font-mono text-[9px] uppercase tracking-widest text-primary"
					>{$_('messages.replying_to')}</span
				>
				<Button size="xs" variant="ghost" onclick={() => (replyToMessageId = null)}
					>{$_('messages.cancel_reply')}</Button
				>
			</div>
		{/if}
		<label for={`message-draft-${conversation.id}`} class="sr-only"
			>{$_('messages.compose_placeholder')}</label
		>
		<div class="flex items-end gap-2">
			<textarea
				id={`message-draft-${conversation.id}`}
				bind:value={draft}
				placeholder={$_('messages.compose_placeholder')}
				class="max-h-28 min-h-11 min-w-0 flex-1 resize-none border border-primary/40 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
				rows="1"></textarea>
			<Button type="submit" size="sm" disabled={!draft.trim() || sending}
				>{$_('messages.send')}</Button
			>
		</div>
	</form>
</section>
