<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import {
		addWishlistRegistryCard,
		getBoosters,
		getWikiForgeTags,
		getWishlists,
		openBooster
	} from '$lib/api';
	import { wikiForgeApiErrorCode } from '$lib/api/wikiforge-contract';
	import BoosterOpeningStage from '$lib/components/boosters/booster-opening-stage.svelte';
	import {
		formatBoosterDelay,
		getBoosterRefreshDelay
	} from '$lib/components/boosters/booster-countdown';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import type {
		CardRecord,
		CollectionTag,
		CollectionTagAssignments,
		PackSummary,
		WishlistRegistrySummary
	} from '$lib/types';

	let packs = $state<PackSummary[] | null>(null);
	let selectedPackId = $state<number | null>(null);
	let selectedPackSnapshot = $state<PackSummary | null>(null);
	let result = $state<CardRecord[] | null>(null);
	let opening = $state(false);
	let openingError = $state<string | null>(null);
	let openingId = $state(0);
	let selectedCard = $state<CardRecord | null>(null);
	let tags = $state<CollectionTag[]>([]);
	let assignments = $state<CollectionTagAssignments>({});
	let wishlists = $state<WishlistRegistrySummary[]>([]);
	let detailDependenciesLoaded = $state(false);
	let now = $state(Date.now());
	const selectedPack = $derived(
		packs?.find((pack) => pack.id === selectedPackId) ??
			(selectedPackSnapshot?.id === selectedPackId ? selectedPackSnapshot : null)
	);
	const nextDelay = $derived(
		selectedPack?.nextAvailableAt
			? formatBoosterDelay(Math.max(0, Date.parse(selectedPack.nextAvailableAt) - now))
			: undefined
	);

	async function refreshPacks() {
		packs = await getBoosters();
		if (selectedPackId != null) {
			const refreshed = packs.find((pack) => pack.id === selectedPackId);
			selectedPackSnapshot =
				refreshed ?? (selectedPackSnapshot ? { ...selectedPackSnapshot, available: 0 } : null);
		}
	}

	onMount(() => {
		const clock = window.setInterval(() => (now = Date.now()), 1_000);
		void refreshPacks().catch(() => (packs = []));
		return () => window.clearInterval(clock);
	});

	$effect(() => {
		const delays = (packs ?? [])
			.map((pack) => getBoosterRefreshDelay(pack.nextAvailableAt))
			.filter((delay): delay is number => delay != null);
		if (!delays.length) return;
		const timer = window.setTimeout(
			() => void refreshPacks().catch(() => undefined),
			Math.min(...delays) + 50
		);
		return () => window.clearTimeout(timer);
	});

	async function open() {
		if (!selectedPack?.available || opening) return;
		opening = true;
		result = null;
		openingError = null;
		try {
			const opened = await openBooster(selectedPack.id);
			result = opened.cards;
			openingId += 1;
		} catch (error) {
			const code = wikiForgeApiErrorCode(error);
			openingError = ['NO_BOOSTER_AVAILABLE', 'NOT_FOUND', 'PACK_EXHAUSTED'].includes(code ?? '')
				? code!
				: 'UNKNOWN';
		} finally {
			await refreshPacks().catch(() => undefined);
			opening = false;
		}
	}

	async function loadDetailDependencies() {
		if (detailDependenciesLoaded) return;
		const [loadedTags, loadedWishlists] = await Promise.all([getWikiForgeTags(), getWishlists()]);
		tags = loadedTags;
		wishlists = loadedWishlists;
		detailDependenciesLoaded = true;
	}

	function openCardDetail(card: CardRecord) {
		selectedCard = card;
		assignments = {
			...assignments,
			[card.id]: card.collectionTagIds ?? (card.collectionTags ?? []).map((tag) => tag.id)
		};
		void loadDetailDependencies().catch(() => undefined);
	}

	async function toggleWishlist(wishlistId: string, card: CardRecord, selected: boolean) {
		if (!selected) return;
		await addWishlistRegistryCard(
			wishlistId,
			'',
			String(card.baseCardId ?? card.catalogueId ?? card.id)
		);
		wishlists = await getWishlists();
	}
</script>

<section class="flex flex-col gap-8">
	<PageHeader
		eyebrow={$_('boosters.eyebrow')}
		title={$_('boosters.title')}
		description={$_('boosters.description')}
	/>

	{#if packs === null}
		<div class="forge-panel min-h-[24rem] animate-pulse"></div>
	{:else if !packs.length}
		<div class="forge-panel grid min-h-64 place-items-center p-8 text-center text-muted-foreground">
			{$_('boosters.no_active_packs')}
		</div>
	{:else if !selectedPack}
		<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" data-testid="active-packs">
			{#each packs as pack (pack.id)}
				<article class="forge-panel flex min-h-full flex-col p-5">
					<div class="grid min-h-64 place-items-center bg-background/40 p-4">
						<img src={pack.imageUrl} alt="" class="max-h-56 max-w-full object-contain" />
					</div>
					<p class="forge-label mt-4">{pack.available} / {pack.max}</p>
					<h2 class="mt-2 text-2xl font-bold">{pack.name}</h2>
					<p class="mt-2 grow text-sm text-muted-foreground">{pack.description}</p>
					{#if pack.imageAttribution}
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							class="mt-2 w-fit text-xs text-muted-foreground underline underline-offset-2"
							href={pack.imageAttribution.sourceUrl}
							target="_blank"
							rel="noreferrer"
						>
							{$_('boosters.image_credit')}
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
					<p class="mt-4 font-mono text-xs text-primary">
						{$_('boosters.pack_card_count', { values: { count: pack.nbCards } })}
					</p>
					<Button
						class="mt-4"
						disabled={!pack.available}
						onclick={() => {
							selectedPackId = pack.id;
							selectedPackSnapshot = pack;
							openingError = null;
						}}
					>
						{pack.available ? $_('boosters.select_pack') : $_('boosters.emptyReserve')}
					</Button>
				</article>
			{/each}
		</div>
	{:else}
		<div class="flex items-center justify-between gap-4">
			<Button
				variant="outline"
				onclick={() => {
					selectedPackId = null;
					selectedPackSnapshot = null;
					result = null;
				}}
			>
				{$_('boosters.back_to_packs')}
			</Button>
			{#if openingError}
				<p class="text-sm text-destructive" role="alert">
					{$_(`boosters.errors.${openingError}`)}
				</p>
			{/if}
		</div>
		<BoosterOpeningStage
			available={selectedPack.available}
			maximum={selectedPack.max}
			{nextDelay}
			packName={selectedPack.name}
			packImage={selectedPack.imageUrl}
			{opening}
			{openingId}
			cards={result}
			error={Boolean(openingError)}
			suspended={Boolean(selectedCard)}
			onOpen={open}
			onOpenCard={openCardDetail}
			onReset={() => {
				result = null;
				openingError = null;
			}}
		/>
	{/if}
</section>

{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		owned
		{wishlists}
		bind:tags
		bind:assignments
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!, selected)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
