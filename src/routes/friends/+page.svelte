<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- dynamic query parameters are appended to resolved routes */
	import * as Dialog from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { operationError } from '$lib/domain/operation-error';
	import { SvelteSet } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import {
		blockUser,
		createFriendRequest,
		getFriends,
		getUserBlocks,
		removeFriend,
		respondToFriendRequest,
		searchUsers,
		unblockUser
	} from '$lib/api';
	import BlockedUserList from '$lib/components/friends/blocked-user-list.svelte';
	import FriendContactCard from '$lib/components/friends/friend-contact-card.svelte';
	import FriendInviteDialog from '$lib/components/friends/friend-invite-dialog.svelte';
	import FriendRequestCard from '$lib/components/friends/friend-request-card.svelte';
	import SentFriendRequestCard from '$lib/components/friends/sent-friend-request-card.svelte';
	import UserBlockDialog from '$lib/components/friends/user-block-dialog.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { getPlayerRelationship } from '$lib/domain/friends/relationship';
	import { _ } from '$lib/i18n';
	import {
		realtimeRefresh,
		refreshIncludes,
		publishRealtimeRefresh
	} from '$lib/realtime/resource-refresh';
	import type { Friendship, User, UserBlock } from '$lib/types';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	let userId = $state('demo-user');
	let friendships = $state<Friendship[]>([]);
	let blocks = $state<UserBlock[]>([]);
	let query = $state('');
	let loading = $state(true);
	let loadError = $state('');
	let removing = $state<Friendship | null>(null);
	const pending = new SvelteSet<string>();
	let inviteOpen = $state(false);
	let blockDialogOpen = $state(false);
	let blockTarget = $state<User | null>(null);
	let requestsOpen = $state(false);
	let activeView = $state<'friends' | 'blocked'>('friends');
	let socialReady = $state(false);
	let handledRealtimeRevision = 0;
	const receivedRequests = $derived(
		friendships.filter(
			(friendship) => friendship.status === 'received' && !isBlocked(friendship.user.id)
		)
	);
	const sentRequests = $derived(
		friendships.filter(
			(friendship) => friendship.status === 'sent' && !isBlocked(friendship.user.id)
		)
	);
	const visibleFriends = $derived(
		friendships.filter(
			(friendship) =>
				friendship.status === 'accepted' &&
				!isBlocked(friendship.user.id) &&
				friendship.user.username
					.toLocaleLowerCase('fr-FR')
					.includes(query.toLocaleLowerCase('fr-FR'))
		)
	);
	const targetIsBlocked = $derived(
		Boolean(blockTarget && blocks.some((block) => block.user.id === blockTarget?.id))
	);

	onMount(() => {
		userId = $currentSession?.user.id ?? 'demo-user';
		void refreshSocialLists()
			.catch(() => undefined)
			.finally(() => {
				loading = false;
				socialReady = true;
			});
	});

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			!socialReady ||
			refresh.revision === handledRealtimeRevision ||
			!refreshIncludes(refresh, 'friends')
		)
			return;
		handledRealtimeRevision = refresh.revision;
		void refreshSocialLists().catch(() => undefined);
	});

	async function refreshSocialLists() {
		loadError = '';
		try {
			[friendships, blocks] = await Promise.all([getFriends(userId), getUserBlocks()]);
		} catch (cause) {
			loadError = operationError(cause);
			throw cause;
		}
	}

	function isBlocked(id: string) {
		return blocks.some((block) => block.user.id === id);
	}

	function confirmBlockFor(user: User) {
		blockTarget = user;
		blockDialogOpen = true;
	}

	async function applyBlockChange() {
		if (!blockTarget) return;
		if (targetIsBlocked) {
			await unblockUser(blockTarget.id);
			await refreshSocialLists();
			return;
		}
		await blockUser(blockTarget.id);
		// Le blocage retire aussi les relations concernées côté API : relire les deux registres.
		await refreshSocialLists();
		publishRealtimeRefresh(['friends', 'profile', 'messages', 'collection']);
	}

	async function invite(candidate: User) {
		await createFriendRequest(userId, candidate.id);
		await refreshSocialLists();
		publishRealtimeRefresh(['friends', 'profile', 'messages', 'collection']);
	}

	async function respond(id: string, status: 'accepted' | 'rejected') {
		if (pending.has(id)) return;
		pending.add(id);
		try {
			await respondToFriendRequest(id, status);
			await refreshSocialLists();
			publishRealtimeRefresh(['friends', 'profile', 'messages', 'collection']);
		} catch (cause) {
			toast.error(operationError(cause));
		} finally {
			pending.delete(id);
		}
	}
	async function remove(id: string) {
		if (pending.has(id)) return;
		pending.add(id);
		try {
			await removeFriend(id);
			removing = null;
			await refreshSocialLists();
			publishRealtimeRefresh(['friends', 'profile', 'messages', 'collection']);
		} catch (cause) {
			toast.error(operationError(cause));
		} finally {
			pending.delete(id);
		}
	}
</script>

<section class="flex flex-col gap-4 pb-8 sm:gap-5">
	<PageHeader eyebrow={$_('friends.eyebrow')} title={$_('friends.title')}>
		{#snippet actions()}
			<Button size="sm" onclick={() => (inviteOpen = true)}>
				<UserPlusIcon data-icon="inline-start" />
				{$_('friends.add_action')}
			</Button>
		{/snippet}
	</PageHeader>

	{#if loadError}<p role="alert">{loadError}</p>
		<Button onclick={() => void refreshSocialLists().catch(() => undefined)}
			>{$_('completion.retry')}</Button
		>{/if}
	<Button
		class="requests-toggle"
		variant="outline"
		onclick={() => (requestsOpen = !requestsOpen)}
		aria-expanded={requestsOpen}
	>
		{$_('arcade.friendRequests')} · {receivedRequests.length + sentRequests.length}
	</Button>
	<div class="friends-layout">
		<div class="friends-contacts">
			<div class="grid grid-cols-2 border border-primary/30 bg-card p-1" role="tablist">
				<Button
					size="sm"
					variant={activeView === 'friends' ? 'default' : 'ghost'}
					role="tab"
					aria-selected={activeView === 'friends'}
					onclick={() => (activeView = 'friends')}
				>
					{$_('friends.friends_tab')}
				</Button>
				<Button
					size="sm"
					variant={activeView === 'blocked' ? 'default' : 'ghost'}
					role="tab"
					aria-selected={activeView === 'blocked'}
					onclick={() => (activeView = 'blocked')}
				>
					{$_('friends.blocked_tab')}
				</Button>
			</div>

			{#if activeView === 'friends'}
				<div class="forge-panel p-3">
					<Input bind:value={query} placeholder={$_('friends.search')} />
				</div>
			{/if}

			{#if loading}
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('friends.loading')}
				</p>
			{:else if activeView === 'blocked'}
				{#if blocks.length}
					<BlockedUserList {blocks} onUnblock={(block) => confirmBlockFor(block.user)} />
				{:else}
					<EmptyState title={$_('friends.blocked_empty')} />
				{/if}
			{:else if visibleFriends.length}
				<div class="friend-contacts-grid">
					{#each visibleFriends as friendship (friendship.id)}
						<FriendContactCard
							busy={pending.has(friendship.id)}
							{friendship}
							onTrade={() => void goto(`${resolve('/trades')}?partner=${friendship.user.id}`)}
							onMessage={() => void goto(`${resolve('/messages')}?user=${friendship.user.id}`)}
							onRemove={() => (removing = friendship)}
							onBlock={() => confirmBlockFor(friendship.user)}
						/>
					{/each}
				</div>
			{:else}
				<EmptyState title={$_('friends.empty')} />
			{/if}
		</div>
		<aside class="friends-requests" class:requests-open={requestsOpen}>
			{#if !loading && receivedRequests.length}
				<section class="flex flex-col gap-2" aria-labelledby="received-requests-title">
					<div class="flex items-center gap-2">
						<h2 id="received-requests-title" class="text-xl font-black uppercase sm:text-2xl">
							{$_('friends.received_title')}
						</h2>
						<Badge variant="secondary">
							{$_('friends.received_count', { values: { count: receivedRequests.length } })}
						</Badge>
					</div>
					<div class="flex flex-col gap-2">
						{#each receivedRequests as friendship (friendship.id)}
							<FriendRequestCard
								busy={pending.has(friendship.id)}
								{friendship}
								onAccept={() => void respond(friendship.id, 'accepted')}
								onDecline={() => void respond(friendship.id, 'rejected')}
								onBlock={() => confirmBlockFor(friendship.user)}
							/>
						{/each}
					</div>
				</section>
			{/if}

			{#if !loading && sentRequests.length}
				<section class="flex flex-col gap-2" aria-labelledby="sent-requests-title">
					<div class="flex items-center gap-2">
						<h2 id="sent-requests-title" class="text-xl font-black uppercase sm:text-2xl">
							{$_('friends.sent_title')}
						</h2>
						<Badge variant="outline">
							{$_('friends.sent_count', { values: { count: sentRequests.length } })}
						</Badge>
					</div>
					<div class="flex flex-col gap-2">
						{#each sentRequests as friendship (friendship.id)}
							<SentFriendRequestCard
								busy={pending.has(friendship.id)}
								{friendship}
								onCancel={() => void remove(friendship.id)}
							/>
						{/each}
					</div>
				</section>
			{/if}
		</aside>
	</div>
</section>

<FriendInviteDialog
	bind:open={inviteOpen}
	loadUsers={(searchQuery) => searchUsers(searchQuery)}
	relationshipFor={(candidateId) => getPlayerRelationship(candidateId, friendships, blocks).status}
	onInvite={invite}
/>

<UserBlockDialog
	bind:open={blockDialogOpen}
	user={blockTarget}
	blocked={targetIsBlocked}
	onConfirm={applyBlockChange}
/>

<Dialog.Root
	open={Boolean(removing)}
	onOpenChange={(value) => {
		if (!value) removing = null;
	}}
	><Dialog.Content
		><Dialog.Header class="pr-12"
			><Dialog.Title>{$_('plan.friends.removeTitle')}</Dialog.Title><Dialog.Description
				>{$_('plan.friends.removeInfo', {
					values: { name: removing?.user.username ?? '' }
				})}</Dialog.Description
			></Dialog.Header
		><Dialog.Footer
			><Button variant="outline" onclick={() => (removing = null)}>{$_('completion.cancel')}</Button
			><Button
				variant="destructive"
				disabled={Boolean(removing && pending.has(removing.id))}
				onclick={() => removing && void remove(removing.id)}>{$_('completion.confirm')}</Button
			></Dialog.Footer
		></Dialog.Content
	></Dialog.Root
>

<style>
	.friends-layout {
		display: grid;
		gap: 24px;
		min-width: 0;
	}
	.friends-contacts {
		display: grid;
		gap: 16px;
		min-width: 0;
	}
	.friends-requests {
		display: none;
	}
	.friends-requests.requests-open {
		display: grid;
		gap: 20px;
		grid-row: 1;
	}
	.friend-contacts-grid {
		display: grid;
		gap: 8px;
	}
	@media (min-width: 1024px) {
		.friends-layout {
			grid-template-columns: minmax(0, 1fr) 300px;
			gap: 32px;
		}
		.friends-requests,
		.friends-requests.requests-open {
			display: flex;
			flex-direction: column;
			gap: 24px;
			grid-row: auto;
			border-left: 1px solid var(--border);
			padding-left: 24px;
		}
		:global(.requests-toggle) {
			display: none;
		}
	}
</style>
