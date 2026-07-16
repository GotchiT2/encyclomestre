<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { Conversation } from '$lib/types';

	let {
		conversations,
		selectedId,
		query = $bindable(''),
		loading = false,
		class: className,
		onSelect
	}: {
		conversations: Conversation[];
		selectedId: string;
		query?: string;
		loading?: boolean;
		class?: string;
		onSelect: (id: string) => void;
	} = $props();

	const visibleConversations = $derived(
		conversations.filter((conversation) =>
			conversation.title.toLocaleLowerCase('fr-FR').includes(query.toLocaleLowerCase('fr-FR'))
		)
	);

	function initials(title: string) {
		return title
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase();
	}

	function conversationDate(value: string) {
		const date = new Date(value);
		const today = new Date();
		return date.toDateString() === today.toDateString()
			? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
			: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
	}
</script>

<aside
	class={cn('flex min-h-0 flex-col bg-background/55', className)}
	data-testid="conversation-list"
>
	<div class="shrink-0 p-3">
		<Input
			bind:value={query}
			placeholder={$_('messages.search')}
			aria-label={$_('messages.search')}
		/>
	</div>
	{#if loading}
		<p class="p-4 font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('messages.loading')}
		</p>
	{:else if visibleConversations.length}
		<nav class="min-h-0 flex-1 overflow-y-auto" aria-label={$_('messages.conversations')}>
			{#each visibleConversations as conversation (conversation.id)}
				<button
					type="button"
					class="grid min-h-20 w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-primary/10 px-3 py-2.5 text-left transition-colors hover:bg-primary/8 focus-visible:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary {selectedId ===
					conversation.id
						? 'bg-primary/12'
						: 'bg-transparent'}"
					onclick={() => onSelect(conversation.id)}
					aria-current={selectedId === conversation.id ? 'true' : undefined}
				>
					<span
						class="relative grid size-12 place-items-center rounded-full border border-primary/30 bg-secondary font-mono text-xs font-bold text-[var(--energy-soft)]"
					>
						{initials(conversation.title)}
						{#if conversation.unreadCount}
							<span
								class="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary font-mono text-[9px] text-primary-foreground"
							>
								{conversation.unreadCount}
							</span>
						{/if}
					</span>
					<span class="min-w-0">
						<strong class="block truncate text-sm text-foreground">{conversation.title}</strong>
						<span class="mt-1 block truncate text-xs text-muted-foreground"
							>{conversation.preview}</span
						>
					</span>
					<time class="self-start pt-1 font-mono text-[9px] text-muted-foreground">
						{conversationDate(conversation.updatedAt)}
					</time>
				</button>
			{/each}
		</nav>
	{:else}
		<p class="p-4 text-sm text-muted-foreground">{$_('messages.empty')}</p>
	{/if}
</aside>
