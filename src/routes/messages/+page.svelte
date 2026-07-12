<script lang="ts">
	import { onMount } from 'svelte';
	import { getGuildWishlistShares } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { GuildWishlistShare } from '$lib/types';

	let shares = $state<GuildWishlistShare[]>([]);
	let loading = $state(true);

	onMount(async () => {
		shares = await getGuildWishlistShares();
		loading = false;
	});
</script>

<section class="flex flex-col gap-6">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('messages.eyebrow')}
		</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight sm:text-5xl">
			{$_('messages.title')}
		</h1>
	</header>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('messages.loading')}
		</p>{:else if shares.length}<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each shares as share (share.id)}<article
					class="border-4 border-double border-primary/30 bg-card p-4"
				>
					<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
						{$_('messages.guild_share')}
					</p>
					<h2 class="mt-2 font-serif text-xl font-black uppercase">{share.title}</h2>
					<p class="mt-2 font-serif text-sm italic text-muted-foreground">{share.description}</p>
					<p class="mt-3 font-mono text-[10px] uppercase tracking-widest text-primary">
						{$_('wishlist.total', { values: { count: share.cardCount } })}
					</p>
					<Button href={`/wishlists?registry=${share.registryId}`} variant="outline" class="mt-4"
						>{$_('messages.open_share')}</Button
					>
				</article>{/each}
		</div>{:else}<p
			class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
		>
			{$_('messages.empty')}
		</p>{/if}
</section>
