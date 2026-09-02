<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { Conversation, MessageRecord } from '$lib/types';

	let {
		conversation,
		thread,
		userId,
		loading = false,
		sending = false,
		canSend = false,
		hasOlder = false,
		loadingOlder = false,
		draft = $bindable(''),
		onClose,
		onLoadOlder,
		onSubmit
	}: {
		conversation: Conversation;
		thread: MessageRecord[];
		userId: string;
		loading?: boolean;
		sending?: boolean;
		canSend?: boolean;
		hasOlder?: boolean;
		loadingOlder?: boolean;
		draft?: string;
		onClose?: () => void;
		onLoadOlder: () => void;
		onSubmit: () => void;
	} = $props();

	let scrollArea = $state<HTMLDivElement>();
	let scrolledThreadKey = '';

	$effect(() => {
		const threadKey = `${conversation.id}:${thread.at(-1)?.id ?? ''}`;
		if (threadKey === scrolledThreadKey) return;
		scrolledThreadKey = threadKey;

		void tick().then(() => {
			if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
		});
	});
</script>

<section class="flex h-full min-h-0 min-w-0 flex-col bg-card" data-testid="message-thread">
	<header
		class="flex min-h-16 shrink-0 items-center gap-2 border-b border-primary/20 px-3 py-2 sm:px-4"
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
				{$_('messages.direct_channel')}
			</p>
			<h2 class="truncate text-lg font-bold">{conversation.title}</h2>
		</div>
	</header>

	<div
		bind:this={scrollArea}
		class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-background/35 p-3 sm:p-4"
		data-testid="message-scroll-area"
	>
		{#if hasOlder}
			<Button
				class="mx-auto"
				size="sm"
				variant="outline"
				disabled={loadingOlder}
				onclick={onLoadOlder}
			>
				{loadingOlder ? $_('messages.loading') : $_('messages.load_older')}
			</Button>
		{/if}
		{#if loading}
			<p class="m-auto font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('messages.loading')}
			</p>
		{:else if !thread.length}
			<p class="m-auto text-sm text-muted-foreground">{$_('messages.empty_thread')}</p>
		{:else}
			{#each thread as message (message.id)}
				<article
					class="max-w-[86%] border px-3 py-2 shadow-sm {message.senderId === userId
						? 'ml-auto border-primary/45 bg-primary/14'
						: 'mr-auto border-primary/15 bg-card'}"
				>
					{#if message.type === 'trade'}
						<p class="forge-label">{$_('messages.trade_offer')}</p>
						{#if message.tradeEvent}
							<p class="mt-2 text-sm">
								{$_('messages.trade_history_status', {
									values: { status: message.tradeEvent.status }
								})}
							</p>
							<Button
								href={`/trades?offer=${message.tradeEvent.tradeId}`}
								size="sm"
								variant="outline"
								class="mt-2"
							>
								{$_('messages.open_trade')}
							</Button>
						{:else}
							<p class="mt-2 text-xs text-muted-foreground">{$_('messages.trade_invalid')}</p>
						{/if}
					{:else}
						<p class="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">
							{message.content}
						</p>
					{/if}
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
		{#if !canSend}
			<p class="mb-2 text-xs text-muted-foreground">{$_('messages.friend_required')}</p>
		{/if}
		<label for={`message-draft-${conversation.id}`} class="sr-only"
			>{$_('messages.compose_placeholder')}</label
		>
		<div class="flex items-end gap-2">
			<textarea
				id={`message-draft-${conversation.id}`}
				bind:value={draft}
				maxlength="2000"
				disabled={!canSend}
				placeholder={$_('messages.compose_placeholder')}
				class="max-h-28 min-h-11 min-w-0 flex-1 resize-none border border-primary/40 bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
				rows="1"></textarea>
			<Button
				type="submit"
				size="sm"
				disabled={!canSend || !draft.trim() || draft.length > 2_000 || sending}
			>
				{$_('messages.send')}
			</Button>
		</div>
		<p class="mt-1 text-right font-mono text-[9px] text-muted-foreground">{draft.length}/2000</p>
	</form>
</section>
