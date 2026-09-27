<script lang="ts">
	import { onMount } from 'svelte';
	import { readGuildWishlists, type GuildWishlist } from '$lib/api/guilds';
	import { getWishlistPage } from '$lib/api/wishlist';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	import type { WishlistPageEntry } from '$lib/types';
	let { guildId }: { guildId: number } = $props();
	let lists = $state<GuildWishlist[]>([]);
	let error = $state('');
	let busy = $state(true);
	let active = $state<GuildWishlist>();
	let entries = $state<WishlistPageEntry[]>([]);
	let page = $state(1);
	let totalPages = $state(1);
	let query = $state('');
	let generation = 0;
	onMount(() => {
		void readGuildWishlists(guildId)
			.then((value) => (lists = value))
			.catch((cause) => (error = operationError(cause)))
			.finally(() => (busy = false));
		return () => {
			generation++;
		};
	});
	async function open(list: GuildWishlist, index = 1) {
		const request = ++generation;
		active = list;
		page = index;
		busy = true;
		error = '';
		try {
			const result = await getWishlistPage(String(list.id), { page: index, query });
			if (request === generation) {
				entries = result.items;
				totalPages = result.meta.totalPages;
			}
		} catch (cause) {
			if (request === generation) error = operationError(cause);
		} finally {
			if (request === generation) busy = false;
		}
	}
</script>

<section class="flex flex-col gap-5">
	{#if error}<p role="alert">{error}</p>{/if}{#if busy}<p>{$_('completion.loading')}</p>{/if}
	{#if active}<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="font-title text-2xl">{active.name}</h2>
			<Button
				variant="outline"
				onclick={() => {
					active = undefined;
					generation++;
					busy = false;
				}}>{$_('completion.guild.wishlists')}</Button
			>
		</div>
		<p>{active.description}</p>
		<p class="text-sm text-muted-foreground">{$_('completion.noGlobalCount')}</p>
		<form
			class="flex gap-3"
			onsubmit={(event) => {
				event.preventDefault();
				void open(active!);
			}}
		>
			<Input bind:value={query} aria-label={$_('completion.searchPage')} /><Button
				type="submit"
				disabled={busy}>{$_('completion.searchPage')}</Button
			>
		</form>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
			{#each entries as entry (entry.card.id)}<CardTile
					card={entry.card}
					showCollectionState={false}
				/>{:else}{#if !busy}<p>{$_('completion.empty')}</p>{/if}{/each}
		</div>
		<div class="flex justify-between gap-3">
			<Button
				variant="outline"
				disabled={page === 1 || busy}
				onclick={() => open(active!, page - 1)}>{$_('completion.previous')}</Button
			><Button
				variant="outline"
				disabled={page >= totalPages || busy}
				onclick={() => open(active!, page + 1)}>{$_('completion.next')}</Button
			>
		</div>
	{:else}<div class="grid gap-4 md:grid-cols-2">
			{#each lists as list (list.id)}<button
					type="button"
					class="forge-panel flex flex-col gap-3 p-5 text-left focus-visible:outline-primary"
					onclick={() => {
						query = '';
						void open(list);
					}}
					>{#if list.image}<img
							src={list.image}
							alt=""
							class="h-28 w-full object-cover"
						/>{/if}<strong class="font-heading text-xl">{list.name}</strong><span
						>{list.ownerName} · {list.nbCards ?? 0}</span
					><span>{list.description}</span></button
				>{:else}{#if !busy}<p>{$_('completion.empty')}</p>{/if}{/each}
		</div>{/if}
</section>
