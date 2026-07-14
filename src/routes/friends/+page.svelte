<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- dynamic query parameters are appended to resolved routes */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import { getFriends, respondToFriendRequest, removeFriend } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { _ } from '$lib/i18n';
	import type { Friendship } from '$lib/types';

	let userId = $state('demo-user');
	let friendships = $state<Friendship[]>([]);
	let query = $state('');
	let loading = $state(true);
	const visibleFriendships = $derived(
		friendships.filter((friendship) =>
			friendship.user.username.toLocaleLowerCase('fr-FR').includes(query.toLocaleLowerCase('fr-FR'))
		)
	);

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		friendships = await getFriends(userId);
		loading = false;
	});

	async function respond(id: string, status: 'accepted' | 'received') {
		const updated = await respondToFriendRequest(id, status);
		friendships = friendships.map((friendship) => (friendship.id === id ? updated : friendship));
	}

	async function remove(id: string) {
		await removeFriend(id);
		friendships = friendships.filter((friendship) => friendship.id !== id);
	}
</script>

<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('friends.eyebrow')}
		title={$_('friends.title')}
		description={$_('friends.description')}
	/>
	<div class="forge-panel p-4"><Input bind:value={query} placeholder={$_('friends.search')} /></div>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('friends.loading')}
		</p>{:else if visibleFriendships.length}<div class="grid gap-3 lg:grid-cols-2">
			{#each visibleFriendships as friendship (friendship.id)}<article class="forge-panel p-4">
					<div class="flex items-center justify-between gap-3">
						<a
							href={resolve('/users/[id]', { id: friendship.user.id })}
							class="flex min-w-0 items-center gap-3"
						>
							<img
								src={friendship.user.avatarUrl ?? ''}
								alt=""
								class="size-11 border border-primary/40 bg-background object-cover"
							/>
							<div class="min-w-0">
								<h2 class="truncate font-serif text-xl font-black uppercase">
									@{friendship.user.username}
								</h2>
								<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
									{$_(`friends.status_${friendship.status}`)}
								</p>
							</div>
						</a>
						<div class="flex flex-wrap justify-end gap-2">
							{#if friendship.status === 'received'}<Button
									size="sm"
									onclick={() => respond(friendship.id, 'accepted')}>{$_('friends.accept')}</Button
								><Button
									size="sm"
									variant="outline"
									onclick={() => respond(friendship.id, 'received')}>{$_('friends.decline')}</Button
								>{:else}<Button
									size="sm"
									variant="outline"
									onclick={() => goto(`${resolve('/trades')}?partner=${friendship.user.id}`)}
									>{$_('friends.trade')}</Button
								><Button
									size="sm"
									variant="outline"
									onclick={() => goto(`${resolve('/messages')}?user=${friendship.user.id}`)}
									>{$_('friends.message')}</Button
								>{/if}<Button size="sm" variant="destructive" onclick={() => remove(friendship.id)}
								>{$_('friends.remove')}</Button
							>
						</div>
					</div>
				</article>{/each}
		</div>{:else}<EmptyState title={$_('friends.empty')} />{/if}
</section>
