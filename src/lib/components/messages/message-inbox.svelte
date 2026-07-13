<script lang="ts">
	import {
		getConversationMessages,
		getConversations,
		markConversationRead,
		sendMessage,
		toggleMessageReaction
	} from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { Conversation, MessageRecord } from '$lib/types';
	import { onMount } from 'svelte';

	let { userId, initialConversationId = '' }: { userId: string; initialConversationId?: string } =
		$props();

	let conversations = $state<Conversation[]>([]);
	let selectedConversationId = $state('');
	let thread = $state<MessageRecord[]>([]);
	let query = $state('');
	let draft = $state('');
	let loading = $state(true);
	let sending = $state(false);
	let replyToMessageId = $state<string | null>(null);
	const reactionEmojis = ['👍', '❤️', '😂', '😮', '🎉'];

	const visibleConversations = $derived(
		conversations.filter((conversation) =>
			conversation.title.toLocaleLowerCase('fr-FR').includes(query.toLocaleLowerCase('fr-FR'))
		)
	);
	const selectedConversation = $derived(
		conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
	);

	onMount(() => {
		selectedConversationId = initialConversationId;
		void loadConversations();
	});

	async function loadConversations() {
		loading = true;
		conversations = await getConversations(userId);
		if (
			!selectedConversationId ||
			!conversations.some((item) => item.id === selectedConversationId)
		) {
			selectedConversationId = conversations[0]?.id ?? '';
		}
		loading = false;
	}

	$effect(() => {
		if (selectedConversationId) void loadThread(selectedConversationId);
	});

	async function loadThread(conversationId: string) {
		thread = await getConversationMessages(conversationId);
		const updated = await markConversationRead(conversationId);
		conversations = conversations.map((conversation) =>
			conversation.id === updated.id ? updated : conversation
		);
	}

	async function submit() {
		if (!selectedConversationId || !draft.trim() || sending) return;
		sending = true;
		const message = await sendMessage(selectedConversationId, {
			senderId: userId,
			content: draft,
			replyToMessageId
		});
		thread = [...thread, message];
		draft = '';
		replyToMessageId = null;
		sending = false;
		await loadConversations();
	}

	function quotedMessage(message: MessageRecord) {
		return message.replyToMessageId
			? (thread.find((candidate) => candidate.id === message.replyToMessageId) ?? null)
			: null;
	}

	async function react(message: MessageRecord, emoji: string) {
		const updated = await toggleMessageReaction(message.id, { userId, emoji });
		thread = thread.map((item) => (item.id === updated.id ? updated : item));
	}
</script>

<div
	class="grid min-h-[34rem] overflow-hidden border-4 border-double border-primary/30 bg-card lg:grid-cols-[19rem_minmax(0,1fr)]"
>
	<aside class="border-b border-primary/20 bg-background p-3 lg:border-r lg:border-b-0">
		<Input
			bind:value={query}
			placeholder={$_('messages.search')}
			aria-label={$_('messages.search')}
		/>
		{#if loading}
			<p class="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('messages.loading')}
			</p>
		{:else if visibleConversations.length}
			<nav
				class="mt-3 flex gap-2 overflow-x-auto lg:flex-col"
				aria-label={$_('messages.conversations')}
			>
				{#each visibleConversations as conversation (conversation.id)}
					<button
						class="min-w-52 border border-primary/20 p-3 text-left transition-colors lg:min-w-0 {selectedConversationId ===
						conversation.id
							? 'bg-primary text-primary-foreground'
							: 'bg-card text-foreground hover:border-primary/60'}"
						onclick={() => (selectedConversationId = conversation.id)}
					>
						<div class="flex items-center justify-between gap-2">
							<span class="truncate font-serif text-base font-black uppercase"
								>{conversation.title}</span
							>{#if conversation.unreadCount}<span
									class="flex size-5 shrink-0 items-center justify-center bg-primary font-mono text-[9px] text-primary-foreground"
									>{conversation.unreadCount}</span
								>{/if}
						</div>
						<p class="mt-1 truncate font-serif text-xs italic opacity-75">{conversation.preview}</p>
					</button>
				{/each}
			</nav>
		{:else}
			<p class="mt-4 font-serif italic text-muted-foreground">{$_('messages.empty')}</p>
		{/if}
	</aside>

	<section class="flex min-w-0 flex-col">
		{#if selectedConversation}
			<header class="border-b border-primary/20 px-4 py-3">
				<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
					{selectedConversation.kind === 'guild'
						? $_('messages.guild_channel')
						: $_('messages.direct_channel')}
				</p>
				<h2 class="mt-1 font-serif text-xl font-black uppercase text-foreground">
					{selectedConversation.title}
				</h2>
			</header>
			<div class="flex min-h-72 flex-1 flex-col gap-3 overflow-y-auto p-4">
				{#each thread as message (message.id)}
					{@const quoted = quotedMessage(message)}
					<article
						class="max-w-[88%] border p-3 {message.senderId === userId
							? 'ml-auto border-primary/60 bg-primary/15'
							: 'border-primary/20 bg-background'}"
					>
						{#if quoted}<blockquote
								class="mb-2 border-l-2 border-primary/60 pl-2 font-serif text-xs italic text-muted-foreground"
							>
								{quoted.content}
							</blockquote>{/if}
						<p class="font-serif text-sm leading-relaxed text-foreground">{message.content}</p>
						{#if message.wishlistShare}<div class="mt-3 border-2 border-primary/40 bg-card p-3">
								<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
									{$_('messages.guild_share')}
								</p>
								<h3 class="mt-1 font-serif text-lg font-black uppercase">
									{message.wishlistShare.title}
								</h3>
								<p class="mt-1 font-serif text-sm italic text-muted-foreground">
									{message.wishlistShare.description}
								</p>
								<p class="mt-2 font-mono text-[10px] uppercase tracking-widest text-primary">
									{$_('wishlist.total', { values: { count: message.wishlistShare.cardCount } })}
								</p>
								<Button
									href={`/wishlists?registry=${message.wishlistShare.registryId}`}
									size="sm"
									variant="outline"
									class="mt-3">{$_('messages.open_share')}</Button
								>
							</div>{/if}
						{#if message.tradeOffer}<section class="mt-3 border-2 border-primary/50 bg-card p-3">
								<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
									{$_('messages.trade_offer')}
								</p>
								<div class="mt-3 grid gap-3 sm:grid-cols-2">
									<div>
										<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
											{$_('messages.trade_offered')}
										</p>
										<p class="mt-1 font-mono text-xs text-primary">
											{message.tradeOffer.offeredCardIds.length} · {message.tradeOffer
												.offeredCredits}
											{$_('messages.trade_credits')}
										</p>
									</div>
									<div>
										<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
											{$_('messages.trade_requested')}
										</p>
										<p class="mt-1 font-mono text-xs text-primary">
											{message.tradeOffer.requestedCardIds.length} · {message.tradeOffer
												.requestedCredits}
											{$_('messages.trade_credits')}
										</p>
									</div>
								</div>
								<Button
									href={`/trades?offer=${message.tradeOffer.offerId}`}
									size="sm"
									variant="outline"
									class="mt-3">{$_('messages.open_trade')}</Button
								>
							</section>{/if}
						<div class="mt-3 flex flex-wrap items-center gap-1">
							<Button
								size="sm"
								variant="ghost"
								class="h-7 px-2 text-[10px]"
								onclick={() => (replyToMessageId = message.id)}>{$_('messages.reply')}</Button
							>{#each message.reactions as reaction (reaction.emoji)}<Button
									size="sm"
									variant="outline"
									class="h-7 gap-1 px-2 text-xs"
									aria-pressed={reaction.userIds.includes(userId)}
									onclick={() => void react(message, reaction.emoji)}
									>{reaction.emoji} {reaction.userIds.length}</Button
								>{/each}
							<details class="relative">
								<summary
									class="cursor-pointer list-none border border-primary/40 px-2 py-1 font-mono text-[10px] text-primary"
									aria-label={$_('messages.react')}>+</summary
								>
								<div
									class="absolute right-0 bottom-full z-10 mb-1 flex border border-primary/40 bg-card p-1 shadow-xl"
								>
									{#each reactionEmojis as emoji (emoji)}<Button
											size="icon-xs"
											variant="ghost"
											aria-label={$_('messages.react')}
											onclick={() => void react(message, emoji)}>{emoji}</Button
										>{/each}
								</div>
							</details>
						</div>
						<p class="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
							{new Date(message.createdAt).toLocaleString('fr-FR')}
						</p>
					</article>
				{/each}
			</div>
			<form
				class="border-t border-primary/20 p-3"
				onsubmit={(event) => {
					event.preventDefault();
					void submit();
				}}
			>
				{#if replyToMessageId}
					<div
						class="mb-2 flex items-center justify-between gap-2 border border-primary/30 bg-background px-3 py-2"
					>
						<span class="font-mono text-[10px] uppercase tracking-widest text-primary"
							>{$_('messages.replying_to')}</span
						>
						<Button size="sm" variant="ghost" onclick={() => (replyToMessageId = null)}
							>{$_('messages.cancel_reply')}</Button
						>
					</div>
				{/if}
				<label for="message-draft" class="sr-only">{$_('messages.compose_placeholder')}</label>
				<div class="flex gap-2">
					<textarea
						id="message-draft"
						bind:value={draft}
						placeholder={$_('messages.compose_placeholder')}
						class="min-h-10 flex-1 resize-none border border-primary/50 bg-background px-3 py-2 font-serif text-sm text-foreground outline-none focus:border-primary"
						rows="2"></textarea><Button
						type="submit"
						disabled={!draft.trim() || sending}
						class="self-end">{$_('messages.send')}</Button
					>
				</div>
			</form>
		{:else}
			<div
				class="flex flex-1 items-center justify-center p-6 font-serif italic text-muted-foreground"
			>
				{$_('messages.empty')}
			</div>
		{/if}
	</section>
</div>
