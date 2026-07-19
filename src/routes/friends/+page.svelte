<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- dynamic query parameters are appended to resolved routes */
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
	import UserBlockDialog from '$lib/components/friends/user-block-dialog.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { getPlayerRelationship } from '$lib/domain/friends/relationship';
	import { _ } from '$lib/i18n';
	import type { Friendship, User, UserBlock } from '$lib/types';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	let userId = $state('demo-user');
	let friendships = $state<Friendship[]>([]);
	let blocks = $state<UserBlock[]>([]);
	let query = $state('');
	let loading = $state(true);
	let inviteOpen = $state(false);
	let blockDialogOpen = $state(false);
	let blockTarget = $state<User | null>(null);
	let activeView = $state<'friends' | 'blocked'>('friends');
	const receivedRequests = $derived(
		friendships.filter(
			(friendship) => friendship.status === 'received' && !isBlocked(friendship.user.id)
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

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		[friendships, blocks] = await Promise.all([getFriends(userId), getUserBlocks()]);
		loading = false;
	});

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
			blocks = blocks.filter((block) => block.user.id !== blockTarget?.id);
			return;
		}
		const block = await blockUser(blockTarget.id);
		blocks = [...blocks.filter((entry) => entry.user.id !== block.user.id), block];
		const friendship = friendships.find((entry) => entry.user.id === block.user.id);
		if (friendship) {
			try {
				await removeFriend(friendship.id);
			} finally {
				friendships = friendships.filter((entry) => entry.id !== friendship.id);
			}
		}
	}

	async function invite(candidate: User) {
		const created = await createFriendRequest(userId, candidate.id);
		friendships = [...friendships, created];
	}

	async function respond(id: string, status: 'accepted' | 'rejected') {
		const updated = await respondToFriendRequest(id, status);
		friendships =
			status === 'rejected'
				? friendships.filter((friendship) => friendship.id !== id)
				: friendships.map((friendship) => (friendship.id === id ? updated : friendship));
	}

	async function remove(id: string) {
		await removeFriend(id);
		friendships = friendships.filter((friendship) => friendship.id !== id);
	}
</script>

<section class="flex flex-col gap-4 pb-8 sm:gap-5">
	<PageHeader
		eyebrow={$_('friends.eyebrow')}
		title={$_('friends.title')}
		description={$_('friends.description')}
	>
		{#snippet actions()}
			<Button size="sm" onclick={() => (inviteOpen = true)}>
				<UserPlusIcon data-icon="inline-start" />
				{$_('friends.add_action')}
			</Button>
		{/snippet}
	</PageHeader>

	{#if !loading && receivedRequests.length}
		<section class="flex flex-col gap-2" aria-labelledby="received-requests-title">
			<div class="flex items-center gap-2">
				<h2
					id="received-requests-title"
					class="font-serif text-xl font-black uppercase sm:text-2xl"
				>
					{$_('friends.received_title')}
				</h2>
				<Badge variant="secondary">
					{$_('friends.received_count', { values: { count: receivedRequests.length } })}
				</Badge>
			</div>
			<div class="flex flex-col gap-2">
				{#each receivedRequests as friendship (friendship.id)}
					<FriendRequestCard
						{friendship}
						onAccept={() => void respond(friendship.id, 'accepted')}
						onDecline={() => void respond(friendship.id, 'rejected')}
						onBlock={() => confirmBlockFor(friendship.user)}
					/>
				{/each}
			</div>
		</section>
	{/if}

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
		<div class="flex flex-col gap-2">
			{#each visibleFriends as friendship (friendship.id)}
				<FriendContactCard
					{friendship}
					onTrade={() => void goto(`${resolve('/trades')}?partner=${friendship.user.id}`)}
					onMessage={() => void goto(`${resolve('/messages')}?user=${friendship.user.id}`)}
					onRemove={() => void remove(friendship.id)}
					onBlock={() => confirmBlockFor(friendship.user)}
				/>
			{/each}
		</div>
	{:else}
		<EmptyState title={$_('friends.empty')} />
	{/if}
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
