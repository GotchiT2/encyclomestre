<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions, compareCardsByRarityDesc } from '$lib/domain/cards/rarities';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import XIcon from '@lucide/svelte/icons/x';
	import type { CardRarity, CardRecord, CardVariant, CollectionTag } from '$lib/types';

	let {
		title,
		cards,
		ownerName,
		selectedIds = $bindable<string[]>([]),
		credits = $bindable(0)
	}: {
		title: string;
		cards: CardRecord[];
		ownerName?: string;
		selectedIds?: string[];
		credits?: number;
	} = $props();
	let query = $state('');
	let rarities = $state<CardRarity[]>([]);
	let tagIds = $state<string[]>([]);
	let sortBy = $state<'rarity' | 'name'>('rarity');
	let variant = $state<CardVariant>('all');
	let page = $state(1);
	const pageSize = 12;
	const selectedCards = $derived(
		selectedIds.map((id) => cards.find((card) => card.id === id)).filter(Boolean) as CardRecord[]
	);
	const availableTags = $derived([
		...new Map(
			cards.flatMap((card) => card.collectionTags ?? []).map((tag) => [tag.id, tag])
		).values()
	]);
	const visibleCards = $derived(
		cards
			.filter((card) => {
				const labels = (card.collectionTags ?? []).map((tag) => tag.id);
				const needle = query.trim().toLocaleLowerCase('fr-FR');
				return (
					!selectedIds.includes(card.id) &&
					(!needle || card.title.toLocaleLowerCase('fr-FR').includes(needle)) &&
					(!rarities.length || rarities.includes(card.rarity)) &&
					matchesCardVariant(card, variant) &&
					(!tagIds.length || tagIds.every((id) => labels.includes(id)))
				);
			})
			.toSorted((a, b) =>
				sortBy === 'name' ? a.title.localeCompare(b.title, 'fr') : compareCardsByRarityDesc(a, b)
			)
	);
	const totalPages = $derived(Math.max(1, Math.ceil(visibleCards.length / pageSize)));
	const pageCards = $derived(visibleCards.slice((page - 1) * pageSize, page * pageSize));

	function toggle<T>(values: T[], value: T) {
		return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
	}

	function tagsFor(card: CardRecord): CollectionTag[] {
		return card.collectionTags ?? [];
	}

	function contactOwns(card: CardRecord) {
		return Boolean(ownerName && card.friendsWhoOwn.some((friend) => friend.username === ownerName));
	}

	function resetPage() {
		page = 1;
	}
</script>

<section class="min-w-0 border border-primary/25 bg-background/40 p-3">
	<h2 class="font-serif text-xl font-black uppercase tracking-tight">{title}</h2>
	<div class="mt-3 border border-primary/20 bg-card p-2">
		<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
			{$_('trades.counterparties')}
		</p>
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each selectedCards as card (card.id)}
				<Button
					size="xs"
					variant="outline"
					class="h-auto max-w-full whitespace-normal break-words text-left"
					style={`color:${card.rarityColor};border-color:${card.rarityColor}`}
					onclick={() => (selectedIds = selectedIds.filter((id) => id !== card.id))}
					>{card.title}
					<XIcon data-icon="inline-end" />
				</Button>
			{/each}
			{#if credits > 0}<span
					class="border border-primary/60 bg-primary/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"
					>{credits} {$_('trades.credit_chip')}</span
				>{/if}
			{#if !selectedCards.length && !credits}<span
					class="font-serif text-sm italic text-muted-foreground"
					>{$_('trades.no_counterparty')}</span
				>{/if}
		</div>
	</div>
	<CardSearchPanel class="mt-3">
		<div
			class="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(14rem,1fr)_auto_auto_auto] lg:items-end"
		>
			<Input
				bind:value={query}
				oninput={resetPage}
				placeholder={$_('collection.search')}
				class="h-8 w-full text-sm"
			/><select
				bind:value={sortBy}
				onchange={resetPage}
				aria-label={$_('collection.sort')}
				class="h-8 w-full self-end border border-primary/50 bg-card px-2 py-0 font-mono text-[10px] leading-8 uppercase tracking-wider text-primary outline-none focus:border-primary lg:w-40"
			>
				<option value="rarity">{$_('collection.sortRarity')}</option>
				<option value="name">{$_('collection.sortName')}</option>
			</select>
			<RaritySelector options={cardRarityOptions} bind:selected={rarities} onChange={resetPage} />
			<label
				class="font-mono text-[9px] uppercase tracking-widest text-primary lg:mx-4 lg:border-l lg:border-primary/25 lg:pl-4"
			>
				{$_('trades.credits')}
				<Input
					class="mt-1 pl-11 h-8 w-full text-sm lg:w-20"
					type="number"
					min="0"
					bind:value={credits}
				/></label
			>
		</div>
		<CardVariantSelector bind:value={variant} onChange={resetPage} class="mt-2" />
		<div class="mt-2 flex flex-wrap gap-1">
			{#each availableTags as tag (tag.id)}
				<Button
					size="xs"
					variant={tagIds.includes(tag.id) ? 'default' : 'outline'}
					style={tagIds.includes(tag.id)
						? `background-color:${tag.color};border-color:${tag.color}`
						: `color:${tag.color};border-color:${tag.color}`}
					onclick={() => {
						tagIds = toggle(tagIds, tag.id);
						resetPage();
					}}>{tag.name}</Button
				>
			{/each}
		</div>
	</CardSearchPanel>
	<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
		{#each pageCards as card (card.id)}
			<div class="relative min-w-0">
				<CardTile {card} tags={tagsFor(card)} showFriendOwners={false} />
				{#if contactOwns(card)}<span
						class="absolute top-2 right-2 z-10 border border-primary/60 bg-card px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider text-primary"
						>{$_('trades.contact_owns', { values: { user: ownerName } })}</span
					>{/if}
				<Button
					aria-label={card.title}
					class="absolute inset-0 z-20 h-full w-full border-0 bg-transparent text-transparent hover:bg-primary/20"
					onclick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						selectedIds = [...selectedIds, card.id];
					}}
				/>
			</div>
		{/each}
	</div>
	<div
		class="sticky bottom-0 z-30 mt-4 flex items-center justify-between gap-2 border-t border-primary/25 bg-card/95 px-2 py-2 backdrop-blur-sm"
	>
		<Button size="xs" variant="outline" disabled={page === 1} onclick={() => (page -= 1)}
			>{$_('codex.previous')}</Button
		>
		<span class="font-mono text-[9px] uppercase tracking-widest text-primary"
			>{$_('codex.page')} {page} / {totalPages}</span
		>
		<Button size="xs" variant="outline" disabled={page === totalPages} onclick={() => (page += 1)}
			>{$_('codex.next')}</Button
		>
	</div>
</section>
