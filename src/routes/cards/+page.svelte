<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const rarities = ['Légendaire', 'Ultra-Rare', 'Super-Rare', 'Rare', 'Peu Commune', 'Commune'];

	function pageHref(page: number) {
		const params = new URLSearchParams({ page: String(page) });
		if (data.filters.query) params.set('q', data.filters.query);
		if (data.filters.rarity) params.set('rarity', data.filters.rarity);
		return `/cards?${params}`;
	}
</script>

<section class="flex flex-col gap-8">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
			{$_('codex.eyebrow')}
		</p>
		<h1
			class="mt-3 font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl"
		>
			{$_('codex.title')}
		</h1>
		<p class="mt-3 max-w-2xl font-serif italic leading-relaxed text-muted-foreground">
			{$_('codex.description')}
		</p>
		<Button variant="outline" class="mt-5 w-full sm:w-auto" disabled>{$_('codex.social')}</Button>
	</header>
	<form
		method="GET"
		class="grid gap-2 border-4 border-double border-primary/30 bg-card p-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
	>
		<Input
			name="q"
			value={data.filters.query}
			placeholder={$_('codex.search')}
			aria-label={$_('codex.search')}
		/>
		<select
			name="rarity"
			class="h-10 border-2 border-primary/40 bg-background px-3 font-mono text-xs uppercase tracking-wider text-primary outline-none focus:border-primary"
			aria-label={$_('codex.rarities')}
			><option value="">{$_('codex.allRarities')}</option>{#each rarities as rarity (rarity)}<option
					value={rarity}
					selected={data.filters.rarity === rarity}>{rarity}</option
				>{/each}</select
		>
		<Button type="submit">{$_('common.filter')}</Button>
	</form>
	{#await data.cards}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('codex.loading')}
		</p>
	{:then result}
		<div
			class="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
		>
			{#each result.items as card (card.id)}<CardTile {card} />{/each}
		</div>
		<nav
			class="flex items-center justify-between border-t border-dashed border-primary/30 pt-5"
			aria-label={$_('codex.page')}
		>
			<Button
				href={pageHref(Math.max(1, result.meta.page - 1))}
				variant="outline"
				disabled={result.meta.page === 1}>{$_('codex.previous')}</Button
			>
			<p class="font-mono text-sm uppercase tracking-widest text-primary">
				{$_('codex.page')}
				{result.meta.page} / {result.meta.totalPages}
			</p>
			<Button
				href={pageHref(Math.min(result.meta.totalPages, result.meta.page + 1))}
				variant="outline"
				disabled={result.meta.page === result.meta.totalPages}>{$_('codex.next')}</Button
			>
		</nav>
	{:catch}<p
			class="border border-destructive/40 bg-destructive/10 p-4 font-serif italic text-destructive"
		>
			{$_('codex.error')}
		</p>{/await}
</section>
