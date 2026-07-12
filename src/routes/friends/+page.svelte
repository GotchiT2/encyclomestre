<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import { getFriends, respondToFriendRequest, removeFriend } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
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
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('friends.eyebrow')}
		</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight sm:text-5xl">
			{$_('friends.title')}
		</h1>
		<p class="mt-3 font-serif italic text-muted-foreground">{$_('friends.description')}</p>
	</header>
	<Input bind:value={query} placeholder={$_('friends.search')} />
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('friends.loading')}
		</p>{:else if visibleFriendships.length}<div class="grid gap-3 lg:grid-cols-2">
			{#each visibleFriendships as friendship (friendship.id)}<article
					class="border-4 border-double border-primary/30 bg-card p-4"
				>
					<div class="flex items-center justify-between gap-3">
						<div class="min-w-0">
							<h2 class="font-serif text-xl font-black uppercase">@{friendship.user.username}</h2>
							<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
								{$_(`friends.status_${friendship.status}`)}
							</p>
						</div>
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
									onclick={() => goto(`/trades?partner=${friendship.user.id}`)}
									>{$_('friends.trade')}</Button
								><Button
									size="sm"
									variant="outline"
									onclick={() => goto(`/messages?user=${friendship.user.id}`)}
									>{$_('friends.message')}</Button
								>{/if}<Button size="sm" variant="destructive" onclick={() => remove(friendship.id)}
								>{$_('friends.remove')}</Button
							>
						</div>
					</div>
				</article>{/each}
		</div>{:else}<p
			class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
		>
			{$_('friends.empty')}
		</p>{/if}
</section>
