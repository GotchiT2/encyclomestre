<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

{#await Promise.all([data.user, data.collection])}
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('friends.loading')}
	</p>
{:then [user, collection]}
	<section class="flex flex-col gap-6">
		<header class="flex items-center gap-4 border-b border-dashed border-primary/30 pb-6">
			<img
				src={user.avatarUrl ?? ''}
				alt=""
				class="size-16 border-2 border-primary/40 bg-card object-cover"
			/>
			<div>
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('friends.profile')}
				</p>
				<h1 class="font-serif text-4xl font-black uppercase tracking-tight">@{user.username}</h1>
				<p class="mt-2 font-serif italic text-muted-foreground">{user.bio}</p>
			</div>
		</header>
		<div>
			<h2 class="font-serif text-2xl font-black uppercase">{$_('friends.collection')}</h2>
			{#if collection.length}<div
					class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6"
				>
					{#each collection as card (card.id)}<CardTile {card} showFriendOwners={false} />{/each}
				</div>{:else}<p
					class="mt-4 border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
				>
					{$_('friends.empty_collection')}
				</p>{/if}
		</div>
	</section>
{:catch}
	<p class="border border-destructive/40 bg-destructive/10 p-4 font-serif italic text-destructive">
		{$_('friends.error')}
	</p>
{/await}
