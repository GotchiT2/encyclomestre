<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { User } from '$lib/types';

	let {
		open = $bindable(false),
		existingUserIds,
		loadUsers,
		onInvite
	}: {
		open?: boolean;
		existingUserIds: string[];
		loadUsers: (query: string) => Promise<User[]>;
		onInvite: (user: User) => void | Promise<void>;
	} = $props();

	let query = $state('');
	let candidates = $state<User[]>([]);
	let loading = $state(false);
	let invitingId = $state<string | null>(null);
	let debounceTimer: number | undefined;
	let requestId = 0;

	$effect(() => {
		const normalizedQuery = query.trim();
		if (!open || normalizedQuery.length < 2) {
			requestId += 1;
			window.clearTimeout(debounceTimer);
			candidates = [];
			loading = false;
			return;
		}

		window.clearTimeout(debounceTimer);
		const currentRequest = ++requestId;
		loading = true;
		debounceTimer = window.setTimeout(async () => {
			try {
				const users = await loadUsers(normalizedQuery);
				if (currentRequest !== requestId) return;
				candidates = users.filter((user) => !existingUserIds.includes(user.id));
			} finally {
				if (currentRequest === requestId) loading = false;
			}
		}, 350);

		return () => window.clearTimeout(debounceTimer);
	});

	async function invite(user: User) {
		if (invitingId) return;
		invitingId = user.id;
		try {
			await onInvite(user);
			open = false;
			query = '';
		} finally {
			invitingId = null;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-xl grid-rows-[auto_minmax(0,1fr)] gap-0">
		<header class="border-b border-primary/20 px-4 py-3 pr-14">
			<Dialog.Title>{$_('friends.invite_search_title')}</Dialog.Title>
			<Dialog.Description class="mt-1 text-sm text-muted-foreground">
				{$_('friends.invite_search_description')}
			</Dialog.Description>
		</header>
		<div class="min-h-0 p-4">
			<Input bind:value={query} placeholder={$_('friends.invite_search_placeholder')} autofocus />
			{#if query.trim().length < 2}
				<p class="mt-4 text-sm text-muted-foreground">{$_('friends.invite_min_chars')}</p>
			{:else if loading}
				<p class="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('friends.invite_searching')}
				</p>
			{:else if candidates.length}
				<ul class="mt-4 grid max-h-80 gap-2 overflow-y-auto">
					{#each candidates as candidate (candidate.id)}
						<li class="flex items-center gap-3 border border-primary/25 bg-background p-2">
							<span
								class="flex size-10 shrink-0 items-center justify-center border border-primary/40 bg-card font-serif text-lg font-black text-primary"
							>
								{candidate.username.slice(0, 1).toUpperCase()}
							</span>
							<span class="min-w-0 flex-1 truncate font-serif font-bold">@{candidate.username}</span
							>
							<Button
								size="sm"
								disabled={Boolean(invitingId)}
								onclick={() => void invite(candidate)}>{$_('friends.invite_action')}</Button
							>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-4 text-sm text-muted-foreground">{$_('friends.invite_no_result')}</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
