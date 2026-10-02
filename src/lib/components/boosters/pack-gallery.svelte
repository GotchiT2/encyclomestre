<script lang="ts">
	import { _ } from '$lib/i18n';
	import { tick, type Snippet } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import BoosterPackArt from './booster-pack-art.svelte';
	import PackScene from '$lib/card-renderer/pack-scene.svelte';
	import PackCatalogue from './pack-catalogue.svelte';
	import { packNameKey, packDescriptionKey } from './pack-labels';
	import type { PackCatalogueItem } from '$lib/types';
	let {
		packs,
		selectedId,
		onSelect,
		onDetails,
		actions
	}: {
		packs: PackCatalogueItem[];
		selectedId: number | null;
		onSelect: (pack: PackCatalogueItem) => void;
		onDetails: (pack: PackCatalogueItem) => void;
		actions?: Snippet;
	} = $props();
	let allOpen = $state(false),
		gallery: HTMLDivElement;
	const availablePacks = $derived(
		packs.filter((pack) => pack.status === 'OPEN' && (pack.credit?.available ?? 0) > 0)
	);
	const selectedIndex = $derived(
		Math.max(
			0,
			availablePacks.findIndex((pack) => pack.id === selectedId)
		)
	);
	const selected = $derived(packs.find((pack) => pack.id === selectedId));
	$effect(() => {
		const id = selectedId;
		void tick().then(() => {
			const card = gallery?.querySelector<HTMLElement>(`[data-pack-id="${id}"]`);
			if (card && gallery)
				gallery.scrollTo({
					left: card.offsetLeft - gallery.offsetLeft - (gallery.clientWidth - card.clientWidth) / 2,
					behavior:
						document.documentElement.dataset.motion === 'reduce' ||
						window.matchMedia('(prefers-reduced-motion:reduce)').matches
							? 'instant'
							: 'smooth'
				});
		});
	});
	const name = (pack: PackCatalogueItem) => {
		const key = packNameKey(pack.name);
		return key ? $_(key) : pack.name;
	};
</script>

<div class="pack-selection">
	<p class="available-heading">
		{$_(availablePacks.length ? 'arcade.availablePacks' : 'arcade.noAvailablePacks')}
	</p>
	<div class="pack-gallery" bind:this={gallery} aria-label={$_('boosters.back_to_packs')}>
		{#each availablePacks as pack (pack.id)}<button
				type="button"
				class="gallery-pack"
				class:selected={pack.id === selectedId}
				data-pack-id={pack.id}
				aria-pressed={pack.id === selectedId}
				aria-label={name(pack)}
				onclick={() => onSelect(pack)}
			>
				{#if pack.id === selectedId}<PackScene
						name={name(pack)}
						image={pack.imageUrl}
						brand={$_('navigation.brand')}
						cardCount={pack.nbCards}
						cardsLabel={$_('arcade.cardsLabel')}
					/>
				{:else}<BoosterPackArt
						name={name(pack)}
						renderKey={pack.renderKey ?? 'standard'}
						cardCount={pack.nbCards}
						imageUrl={pack.imageUrl}
					/>{/if}
				<span>{name(pack)}</span></button
			>{/each}
	</div>
	<div class="gallery-navigation">
		<Button
			variant="outline"
			disabled={selectedIndex === 0 || !availablePacks.length}
			onclick={() => onSelect(availablePacks[selectedIndex - 1])}
			aria-label={$_('arcade.previousPack')}>←</Button
		><Button variant="outline" onclick={() => (allOpen = true)}>{$_('arcade.allPacks')}</Button
		><Button
			variant="outline"
			disabled={!availablePacks.length || selectedIndex >= availablePacks.length - 1}
			onclick={() => onSelect(availablePacks[selectedIndex + 1])}
			aria-label={$_('arcade.nextPack')}>→</Button
		>
	</div>
	{#if selected}<div class="selected-information">
			<p class="text-xs font-semibold uppercase tracking-wider text-primary">
				{$_('boosters.family.' + selected.family)}
			</p>
			<h2 class="text-3xl">{name(selected)}</h2>
			{#if actions}{@render actions()}{/if}
			<p class="pack-description text-sm">
				{packDescriptionKey(selected.description)
					? $_(packDescriptionKey(selected.description)!)
					: selected.description}
			</p>
			<p class="text-sm text-muted-foreground">
				{$_('boosters.catalogue.status.' + selected.status, {
					default: $_('plan.boosters.unavailable')
				})}
			</p>
			<Button variant="outline" onclick={() => onDetails(selected)}
				>{$_('boosters.view_contents')}</Button
			>
		</div>{/if}
</div>
<Dialog.Root bind:open={allOpen}
	><Dialog.Content class="arcade-sheet overflow-y-auto p-4 sm:p-5"
		><Dialog.Header
			><Dialog.Title>{$_('arcade.allPacks')}</Dialog.Title><Dialog.Description
				>{$_('boosters.description')}</Dialog.Description
			></Dialog.Header
		><PackCatalogue
			{packs}
			{onDetails}
			onOpen={(pack) => {
				onSelect(pack);
				allOpen = false;
			}}
		/></Dialog.Content
	></Dialog.Root
>

<style>
	.available-heading {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
		color: var(--primary);
		grid-column: 1/-1;
	}
	.gallery-pack.selected {
		flex-basis: 210px;
	}
	.gallery-pack :global(.pack-scene) {
		height: 215px;
	}
	@media (max-width: 1023px) {
		.pack-gallery {
			height: 215px;
		}
		.gallery-pack span {
			display: none;
		}
		.pack-description {
			display: none;
		}
		.selected-information {
			padding: 0 !important;
			border: 0 !important;
		}
		.selected-information h2 {
			font-size: 24px;
		}
		.selected-information > p {
			font-size: 12px;
		}
		.pack-selection {
			gap: 8px;
		}
		.gallery-navigation {
			order: 0;
		}
	}

	.pack-selection {
		min-width: 0;
		display: grid;
		gap: 1rem;
	}
	.pack-gallery {
		position: relative;
		display: flex;
		gap: 1.25rem;
		overflow-x: auto;
		max-width: 100%;
		padding: 0 max(1rem, calc(50% - 100px));
		scroll-snap-type: x mandatory;
		scrollbar-width: thin;
	}
	.gallery-pack {
		min-width: 0;
		flex: 0 0 150px;
		scroll-snap-align: center;
		opacity: 0.55;
		transition:
			opacity 160ms,
			transform 160ms;
		display: grid;
		gap: 0.75rem;
		align-content: start;
	}
	.gallery-pack.selected {
		opacity: 1;
		transform: translateY(-0.4rem);
	}
	.gallery-pack:focus-visible {
		outline: 3px solid var(--primary);
		outline-offset: 3px;
	}
	.gallery-pack span {
		font:
			800 1.3rem 'Barlow Condensed',
			sans-serif;
		text-align: center;
	}
	.gallery-navigation {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}
	.selected-information {
		display: grid;
		gap: 0.6rem;
		padding: 1rem;
		border-top: 1px solid var(--border);
	}
	.selected-information :global(button) {
		justify-self: start;
	}
	@media (min-width: 1024px) {
		.available-heading {
			grid-column: 1;
			grid-row: 1;
		}
		.pack-selection {
			grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
			grid-template-rows: auto auto auto;
		}
		.pack-gallery {
			height: 360px;
			grid-column: 1;
			grid-row: 2;
		}
		.gallery-pack {
			flex-basis: 200px;
		}
		.pack-gallery {
			padding-inline: max(1rem, calc(50% - 110px));
		}
		.gallery-navigation {
			grid-column: 1;
			grid-row: 3;
		}
		.selected-information {
			grid-column: 2;
			grid-row: 1/4;
			border-top: 0;
			border-left: 1px solid var(--border);
			align-content: start;
		}
	}
</style>
