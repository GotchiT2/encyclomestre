<script lang="ts">
	import { openCardDetail } from '$lib/components/cards/detail-state';
	import { _ } from '$lib/i18n';
	import VariantCardFace from '$lib/components/cards/variant-card-face.svelte';
	import CardStateIndicators from '$lib/components/cards/card-state-indicators.svelte';
	import FriendOwnershipChip from '$lib/components/cards/friend-ownership-chip.svelte';
	import type { CardRecord, CollectionTag } from '$lib/types';
	import LockIcon from '@lucide/svelte/icons/lock';
	import { activeAuctionCardIds } from '$lib/auctions/store';

	let {
		card,
		showFriendOwners = true,
		showCollectionState = true,
		tags = [],
		tagDisplay = 'bookmark',
		stateIndicatorsOffset = 0,
		comparisonOwnership,
		interactive = true,
		onOpen,
		onOrientationChange
	}: {
		card: CardRecord;
		showFriendOwners?: boolean;
		/** Masque les indicateurs propres à une collection (quantités, listes et protection). */
		showCollectionState?: boolean;
		tags?: CollectionTag[];
		tagDisplay?: 'bookmark' | 'full';
		stateIndicatorsOffset?: number;
		comparisonOwnership?: { count: number; label: string };
		interactive?: boolean;
		onOpen?: (card: CardRecord) => void;
		onOrientationChange?: (landscape: boolean) => void;
	} = $props();

	function handleOpen() {
		(onOpen ?? openCardDetail)(card);
	}
</script>

<article
	class="wikiforge-card-size relative bg-transparent"
	data-testid="card-tile"
	data-variant-id={card.variantId}
>
	<VariantCardFace {card} compact={interactive} {onOrientationChange} />
	{#if card.activeSale || card.saleId}
		<span
			class="pointer-events-none absolute top-[8%] right-[7%] z-30 bg-primary px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-primary-foreground shadow-[0_0_16px_rgb(0_0_0_/_75%)]"
			data-testid="card-active-sale"
		>
			{$_('collection.on_sale')}
		</span>
	{/if}
	{#if card.activeAuctionId || (card.packId != null && $activeAuctionCardIds.has(card.id))}
		<span
			class="pointer-events-none absolute top-[17%] right-[7%] z-30 border border-energy bg-background/95 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-wider text-energy shadow-lg"
			data-testid="card-active-auction">{$_('collection.on_auction')}</span
		>
	{/if}
	{#if interactive}
		<button
			type="button"
			class="absolute inset-0 z-30 size-auto cursor-pointer rounded-none bg-transparent transition-colors hover:bg-primary/20 focus-visible:bg-primary/15 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-4px]"
			aria-label={card.title}
			onclick={handleOpen}
		></button>
	{/if}
	{#if tags.length}
		{#if tagDisplay === 'bookmark'}
			<div
				class="pointer-events-none absolute top-[18%] right-[2%] z-30 flex flex-col gap-1"
				data-testid="card-tag-bookmarks"
			>
				{#each tags as tag (tag.id)}
					<span
						class="h-8 w-2.5 border border-l-0 shadow-lg"
						style={`border-color:${tag.color};background:${tag.color}`}
						aria-label={tag.name}
						title={tag.name}
					></span>
				{/each}
			</div>
		{:else}
			<div class="absolute right-[8%] bottom-[11%] left-[8%] z-30 flex items-center gap-1">
				{#each tags.slice(0, 2) as tag (tag.id)}
					<span
						class="max-w-20 truncate border border-primary/70 bg-background/90 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-foreground"
						style={`border-color:${tag.color};color:${tag.color}`}>{tag.name}</span
					>
				{/each}
				{#if tags.length > 2}
					<details class="group/tags relative shrink-0">
						<summary
							class="cursor-pointer list-none border border-primary/70 bg-background/90 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-primary"
							aria-label={$_('collection.moreTags', { values: { count: tags.length - 2 } })}
							>+{tags.length - 2}</summary
						>
						<ul
							class="absolute bottom-full left-0 mb-2 hidden min-w-32 border border-primary/40 bg-card p-2 shadow-xl group-open/tags:block"
						>
							{#each tags.slice(2) as tag (tag.id)}
								<li
									class="mb-1 last:mb-0 border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
									style={`border-color:${tag.color};color:${tag.color}`}
								>
									{tag.name}
								</li>
							{/each}
						</ul>
					</details>
				{/if}
			</div>
		{/if}
	{/if}
	{#if showFriendOwners && card.friendsWhoOwn.length}
		<FriendOwnershipChip owners={card.friendsWhoOwn} />
	{/if}
	{#if showCollectionState && (card.userProtected || card.ownedCount > 0 || comparisonOwnership?.count || card.wishlistMemberships?.length || card.sharedWishlistMemberships?.length || (showFriendOwners && card.friendsWhoOwn.length))}
		<div
			class="pointer-events-none absolute left-[7%] z-40 flex flex-col items-start gap-1"
			style={`top:calc(8% + ${stateIndicatorsOffset}px)`}
			data-testid="card-left-indicators"
		>
			{#if card.userProtected}
				<span
					class="grid size-7 place-items-center border border-primary/70 bg-background/90 text-primary shadow-lg"
					aria-label={$_('collection.protected_indicator')}
					title={$_('collection.protected_indicator')}
					data-testid="card-protected-indicator"
				>
					<LockIcon class="size-3.5" />
				</span>
			{/if}
			{#if card.ownedCount > 0 || comparisonOwnership?.count || card.wishlistMemberships?.length || card.sharedWishlistMemberships?.length}
				<CardStateIndicators
					ownedCount={card.ownedCount}
					{comparisonOwnership}
					wishlists={card.wishlistMemberships}
					sharedWishlists={card.sharedWishlistMemberships}
					owners={[]}
				/>
			{/if}
		</div>
	{/if}
</article>
