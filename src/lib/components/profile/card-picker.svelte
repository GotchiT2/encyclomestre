<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import { mockCollectionTagAssignments, mockCollectionTags } from '$lib/api/mocks/collection-tags';
	import type { CardRecord } from '$lib/types';

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
	let rarities = $state<string[]>([]);
	let tagIds = $state<string[]>([]);
	const filteredCards = $derived(
		cards.filter((card) => {
			const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
			const cardTags = mockCollectionTagAssignments[card.id] ?? [];
			return (
				(!normalizedQuery ||
					card.title.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
					card.shortDescription.toLocaleLowerCase('fr-FR').includes(normalizedQuery)) &&
				(!rarities.length || rarities.includes(card.rarity)) &&
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

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		class="max-h-[90dvh] border-4 border-double border-primary/40 bg-card p-0 sm:inset-x-[8%] sm:bottom-6 sm:max-w-none"
	>
		<div class="border-b border-primary/20 p-4 pr-14">
			<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('profile.select_cards')}
			</p>
			<Sheet.Title class="mt-1 font-serif text-2xl font-black uppercase tracking-tight"
				>{title}</Sheet.Title
			>
		</div>
		<div class="overflow-y-auto p-4">
			<Input bind:value={query} placeholder={$_('collection.search')} class="mb-3" />
			<div class="mb-3 flex flex-wrap gap-1.5" aria-label={$_('collection.rarities')}>
				{#each [...new Set(cards.map((card) => card.rarity))] as rarity (rarity)}
					{@const reference = cards.find((card) => card.rarity === rarity)!}
					<Button
						variant={rarities.includes(rarity) ? 'default' : 'outline'}
						size="xs"
						style={rarities.includes(rarity)
							? `background-color:${reference.rarityColor};border-color:${reference.rarityColor}`
							: `color:${reference.rarityColor};border-color:${reference.rarityColor}`}
						onclick={() => (rarities = toggle(rarities, rarity))}>{reference.rarityInitials}</Button
					>
				{/each}
			</div>
			<div class="mb-4 flex flex-wrap gap-1.5" aria-label={$_('collection.tags')}>
				{#each mockCollectionTags as tag (tag.id)}
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
	</Sheet.Content>
</Sheet.Root>
