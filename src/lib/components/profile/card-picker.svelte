<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { CardRarity, CardRecord, CardVariant } from '$lib/types';

	let {
		open = $bindable(false),
		cards,
		title,
		onSelect
	}: {
		open?: boolean;
		cards: CardRecord[];
		title: string;
		onSelect: (card: CardRecord) => void;
	} = $props();

	let query = $state('');
	let rarities = $state<CardRarity[]>([]);
	let tagIds = $state<string[]>([]);
	let variant = $state<CardVariant>('all');
	const availableTags = $derived([
		...new Map(
			cards.flatMap((card) => card.collectionTags ?? []).map((tag) => [tag.id, tag])
		).values()
	]);
	const filteredCards = $derived(
		cards.filter((card) => {
			const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
			const cardTags = (card.collectionTags ?? []).map((tag) => tag.id);
			return (
				(!normalizedQuery ||
					card.title.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
					card.shortDescription.toLocaleLowerCase('fr-FR').includes(normalizedQuery)) &&
				(!rarities.length || rarities.includes(card.rarity)) &&
				matchesCardVariant(card, variant) &&
				(!tagIds.length || tagIds.every((tagId) => cardTags.includes(tagId)))
			);
		})
	);

	function toggle<T>(items: T[], item: T) {
		return items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item];
	}

	function choose(card: CardRecord) {
		onSelect(card);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="h-[min(90dvh,58rem)] max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-0">
		<div class="flex min-h-12 items-center gap-3 border-b border-primary/20 px-4 py-2 pr-14">
			<p class="shrink-0 font-mono text-[9px] uppercase tracking-widest text-primary">
				{$_('profile.select_cards')}
			</p>
			<span class="h-4 w-px bg-primary/25" aria-hidden="true"></span>
			<Dialog.Title class="truncate text-lg leading-tight sm:text-xl">{title}</Dialog.Title>
		</div>
		<div class="min-h-0 overflow-y-auto p-4">
			<Input bind:value={query} placeholder={$_('collection.search')} class="mb-3" />
			<CardVariantSelector bind:value={variant} class="mb-3" />
			<div class="mb-3" aria-label={$_('collection.rarities')}>
				<RaritySelector options={cardRarityOptions} bind:selected={rarities} />
			</div>
			<div class="mb-4 flex flex-wrap gap-1.5" aria-label={$_('collection.tags')}>
				{#each availableTags as tag (tag.id)}
					<Button
						variant={tagIds.includes(tag.id) ? 'default' : 'outline'}
						size="xs"
						style={tagIds.includes(tag.id)
							? `background-color:${tag.color};border-color:${tag.color}`
							: `color:${tag.color};border-color:${tag.color}`}
						onclick={() => (tagIds = toggle(tagIds, tag.id))}>{tag.name}</Button
					>
				{/each}
			</div>
			<div class="wikiforge-card-grid">
				{#each filteredCards as card (card.id)}
					<div class="wikiforge-card-size relative">
						<CardTile {card} showFriendOwners={false} />
						<Button
							aria-label={card.title}
							class="absolute inset-0 z-20 h-full w-full border-0 bg-transparent text-transparent hover:bg-primary/20"
							onclick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								choose(card);
							}}
						/>
					</div>
				{/each}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
