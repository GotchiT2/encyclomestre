<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- the resolved route receives dynamic query parameters */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CardGrid from '$lib/components/collection/card-grid.svelte';
	import FilterControls from '$lib/components/collection/filter-controls.svelte';
	import CardTile from '$lib/components/card-tile.svelte';
	import ProfileGallery from '$lib/components/profile/profile-gallery.svelte';
	import RegistrySummary from '$lib/components/profile/registry-summary.svelte';
	import PublicWishlistList from '$lib/components/profile/public-wishlist-list.svelte';
	import { compareCardsByRarityDesc } from '$lib/domain/cards/rarities';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import { _ } from '$lib/i18n';
	import type {
		CardRarity,
		CardRecord,
		CardVariant,
		CollectionTag,
		CollectionTagAssignments,
		ProfileRegistrySummary,
		ProfileSettings,
		PublicWishlist,
		SaleListing,
		User
	} from '$lib/types';

	type ProfileTab = 'showcase' | 'wishlists' | 'collection';

	const untaggedOption = '__untagged__';
	let {
		user,
		collection,
		catalogue,
		settings,
		summary,
		sales,
		publicWishlists,
		tags,
		assignments
	}: {
		user: User;
		collection: CardRecord[];
		catalogue: CardRecord[];
		settings: ProfileSettings;
		summary: ProfileRegistrySummary;
		sales: SaleListing[];
		publicWishlists: PublicWishlist[];
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
	} = $props();

	let activeTab = $state<ProfileTab>('showcase');
	let query = $state('');
	let sortBy = $state<'name' | 'rarity'>('rarity');
	let selectedRarities = $state<CardRarity[]>([]);
	let tagFilterIds = $state<string[]>([]);
	let variant = $state<CardVariant>('all');

	const cardsById = $derived(new Map(catalogue.map((card) => [card.id, card])));
	const wantedCards = $derived(
		settings.wantedCardIds.flatMap((cardId) => {
			const card = cardsById.get(cardId);
			return card ? [card] : [];
		})
	);

	function clearFilters() {
		query = '';
		sortBy = 'rarity';
		selectedRarities = [];
		tagFilterIds = [];
		variant = 'all';
	}

	function visibleCards() {
		const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
		return collection
			.filter((card) => {
				const cardTagIds = assignments[card.id] ?? [];
				const matchesTag =
					!tagFilterIds.length ||
					(tagFilterIds.includes(untaggedOption) && !cardTagIds.length) ||
					tagFilterIds.some((tagId) => cardTagIds.includes(tagId));
				return (
					card.title.toLocaleLowerCase('fr-FR').includes(normalizedQuery) &&
					(!selectedRarities.length || selectedRarities.includes(card.rarity)) &&
					matchesCardVariant(card, variant) &&
					matchesTag
				);
			})
			.toSorted((first, second) => {
				if (sortBy === 'rarity') return compareCardsByRarityDesc(first, second);
				return first.title.localeCompare(second.title, 'fr');
			});
	}

	function galleryCards(cardIds: string[]) {
		return cardIds.flatMap((cardId) => {
			const card = cardsById.get(cardId);
			return card ? [card] : [];
		});
	}

	function saleCard(sale: SaleListing) {
		return cardsById.get(sale.cardId);
	}

	function offerWishlistCard(userCardId: string) {
		void goto(
			`${resolve('/trades')}?partner=${encodeURIComponent(user.id)}&offerCards=${encodeURIComponent(userCardId)}`
		);
	}
</script>

<section
	class="flex flex-col gap-6 pb-12 sm:gap-8"
	style={`--accent-copper:${settings.accentColor}`}
>
	<header class="border-b border-dashed border-primary/30 pb-6">
		<div class="flex items-center gap-4">
			{#if user.avatarUrl}
				<img
					src={user.avatarUrl}
					alt=""
					class="size-16 border-2 border-primary/40 bg-card object-cover"
				/>
			{:else}
				<div
					class="flex size-16 items-center justify-center border-2 border-primary/40 bg-card font-serif text-3xl font-black text-primary"
				>
					{user.username.slice(0, 1).toUpperCase()}
				</div>
			{/if}
			<div class="min-w-0">
				<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
					{$_('friends.profile')}
				</p>
				<h1
					class="mt-1 font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl"
				>
					@{settings.username || user.username}
				</h1>
				{#if user.bio}<p class="mt-2 font-serif italic text-muted-foreground">{user.bio}</p>{/if}
			</div>
		</div>
		{#if settings.bioTags.length}<div class="mt-4 flex flex-wrap gap-2">
				{#each settings.bioTags as tag (tag)}<span
						class="border border-primary/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary"
						>#{tag}</span
					>{/each}
			</div>{/if}
	</header>

	<div
		class="grid grid-cols-3 border border-primary/30 bg-card p-1"
		role="tablist"
		aria-label={$_('friends.profile_tabs')}
	>
		<button
			class="h-10 font-mono text-[10px] font-bold uppercase tracking-widest {activeTab ===
			'wishlists'
				? 'bg-primary text-primary-foreground'
				: 'text-primary'}"
			role="tab"
			aria-selected={activeTab === 'wishlists'}
			onclick={() => (activeTab = 'wishlists')}>{$_('friends.wishlists_tab')}</button
		>
		<button
			class="h-10 font-mono text-[10px] font-bold uppercase tracking-widest {activeTab ===
			'showcase'
				? 'bg-primary text-primary-foreground'
				: 'text-primary'}"
			role="tab"
			aria-selected={activeTab === 'showcase'}
			onclick={() => (activeTab = 'showcase')}>{$_('friends.showcase_tab')}</button
		>
		<button
			class="h-10 font-mono text-[10px] font-bold uppercase tracking-widest {activeTab ===
			'collection'
				? 'bg-primary text-primary-foreground'
				: 'text-primary'}"
			role="tab"
			aria-selected={activeTab === 'collection'}
			onclick={() => (activeTab = 'collection')}>{$_('friends.collection_tab')}</button
		>
	</div>

	{#if activeTab === 'showcase'}
		<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
			<div class="flex flex-col gap-6">
				<section>
					<h2 class="font-serif text-2xl font-black uppercase tracking-tight text-foreground">
						{$_('profile.showcase_title')}
					</h2>
					<div class="mt-4 flex flex-col gap-4">
						{#each settings.showcases as gallery (gallery.id)}
							<ProfileGallery
								{gallery}
								cards={galleryCards(gallery.cardIds)}
								editable={false}
								allowCardAdd={false}
							/>
						{/each}
						{#if !settings.showcases.length}<p
								class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
							>
								{$_('profile.showcase_empty')}
							</p>{/if}
					</div>
				</section>

				<section>
					<h2 class="font-serif text-2xl font-black uppercase tracking-tight text-foreground">
						{$_('profile.wanted_title')}
					</h2>
					{#if wantedCards.length}<div class="wikiforge-card-grid mt-4">
							{#each wantedCards as card (card.id)}<CardTile
									{card}
									showFriendOwners={false}
								/>{/each}
						</div>{:else}<p
							class="mt-4 border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
						>
							{$_('friends.empty_wanted')}
						</p>{/if}
				</section>

				<section>
					<h2 class="font-serif text-2xl font-black uppercase tracking-tight text-foreground">
						{$_('profile.sales_title')}
					</h2>
					{#if sales.length}<div class="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
							{#each sales as sale (sale.id)}
								{@const card = saleCard(sale)}
								{#if card}<article
										class="w-36 shrink-0 snap-start border border-primary/30 bg-card p-2 sm:w-40"
									>
										<CardTile {card} showFriendOwners={false} />
										<p class="mt-2 font-mono text-[10px] uppercase tracking-widest text-primary">
											{sale.price}
											{sale.currency} · {sale.type === 'auction'
												? $_('cardDetail.auction')
												: $_('cardDetail.direct_sale')}
										</p>
									</article>{/if}
							{/each}
						</div>{:else}<p
							class="mt-4 border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
						>
							{$_('friends.empty_sales')}
						</p>{/if}
				</section>
			</div>
			<RegistrySummary {summary} />
		</div>
	{:else if activeTab === 'wishlists'}
		{#if publicWishlists.length}
			<PublicWishlistList wishlists={publicWishlists} onTrade={offerWishlistCard} />
		{:else}
			<p
				class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
			>
				{$_('friends.empty_public_wishlists')}
			</p>
		{/if}
	{:else}
		<div class="flex flex-col gap-6">
			<FilterControls
				bind:query
				bind:sortBy
				bind:selectedRarities
				bind:tagFilterIds
				bind:variant
				{tags}
				{untaggedOption}
				allowTagCreation={false}
				onOpenTagEditor={() => undefined}
				onClear={clearFilters}
			/>
			{#if visibleCards().length}<CardGrid
					cards={visibleCards()}
					{tags}
					{assignments}
					isSelectionMode={false}
					selectedCardIds={[]}
					onToggleCard={() => undefined}
				/>{:else}<p
					class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
				>
					{$_('friends.empty_collection')}
				</p>{/if}
		</div>
	{/if}
</section>
