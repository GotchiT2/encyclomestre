<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import {
		addWishlistRegistryCard,
		getBoosters,
		getPackDetails,
		getPacks,
		getVariants,
		getWikiForgeTags,
		getWishlists,
		mergePackCatalogue,
		openBooster,
		openAllBoosters,
		resetPackDetailsCache
	} from '$lib/api';
	import { resolvePackDefinition, type ResolvedPackDefinition } from '$lib/api/boosters';
	import { wikiForgeApiErrorCode } from '$lib/api/wikiforge-contract';
	import BoosterOpeningStage from '$lib/components/boosters/booster-opening-stage.svelte';
	import PackCatalogue from '$lib/components/boosters/pack-catalogue.svelte';
	import PackDetailDialog from '$lib/components/boosters/pack-detail-dialog.svelte';
	import { packNameKey } from '$lib/components/boosters/pack-labels';
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
		PackCatalogueItem,
		PackDefinition,
		PackSummary,
		VariantDefinition,
		WishlistRegistrySummary
	} from '$lib/types';

	let packDefinitions = $state<PackDefinition[] | null>(null);
	let credits = $state<PackSummary[]>([]);
	let variants = $state<VariantDefinition[]>([]);
	let selectedPackId = $state<number | null>(null);
	let selectedPackSnapshot = $state<PackCatalogueItem | null>(null);
	let detailPack = $state<PackCatalogueItem | null>(null);
	let detail = $state<ResolvedPackDefinition | null>(null);
	let detailLoading = $state(false);
	let detailError = $state(false);
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
	const packs = $derived(packDefinitions ? mergePackCatalogue(packDefinitions, credits) : null);
	const selectedPack = $derived(
		packs?.find((pack) => pack.id === selectedPackId) ??
			(selectedPackSnapshot?.id === selectedPackId ? selectedPackSnapshot : null)
	);
	const nextDelay = $derived(
		selectedPack?.credit?.nextAvailableAt
			? formatBoosterDelay(Math.max(0, Date.parse(selectedPack.credit.nextAvailableAt) - now))
			: undefined
	);
	const selectedPackName = $derived.by(() => {
		if (!selectedPack) return '';
		const key = packNameKey(selectedPack.name);
		return key ? $_(key) : selectedPack.credit?.name || selectedPack.name;
	});

	async function refreshPacks() {
		const [catalogue, inventory, loadedVariants] = await Promise.all([
			getPacks(),
			getBoosters(),
			getVariants()
		]);
		packDefinitions = catalogue;
		credits = inventory;
		variants = loadedVariants;
		if (selectedPackId != null) {
			const refreshed = mergePackCatalogue(catalogue, inventory).find(
				(pack) => pack.id === selectedPackId
			);
			selectedPackSnapshot =
				refreshed ??
				(selectedPackSnapshot ? { ...selectedPackSnapshot, credit: null, status: 'CLOSED' } : null);
		}
	}

	onMount(() => {
		const clock = window.setInterval(() => (now = Date.now()), 1_000);
		void refreshPacks().catch(() => (packDefinitions = []));
		return () => window.clearInterval(clock);
	});

	$effect(() => {
		const delays = credits
			.map((pack) => getBoosterRefreshDelay(pack.nextAvailableAt))
			.filter((delay): delay is number => delay != null);
		if (!delays.length) return;
		const timer = window.setTimeout(
			() => void refreshPacks().catch(() => undefined),
			Math.min(...delays) + 50
		);
		return () => window.clearTimeout(timer);
	});

	async function open(all = false) {
		if (!selectedPack?.credit?.available || selectedPack.status !== 'OPEN' || opening) return;
		opening = true;
		result = null;
		openingError = null;
		try {
			const opened = all
				? await openAllBoosters(selectedPack.id)
				: await openBooster(selectedPack.id);
			result = opened.cards;
			openingId += 1;
		} catch (error) {
			const code = wikiForgeApiErrorCode(error);
			openingError = ['NO_BOOSTER_AVAILABLE', 'NOT_FOUND', 'PACK_EXHAUSTED'].includes(code ?? '')
				? code!
				: 'UNKNOWN';
		} finally {
			resetPackDetailsCache();
			await refreshPacks().catch(() => undefined);
			opening = false;
		}
	}

	function selectPack(pack: PackCatalogueItem) {
		selectedPackId = pack.id;
		selectedPackSnapshot = pack;
		openingError = null;
		result = null;
	}

	async function showDetails(pack: PackCatalogueItem) {
		detailPack = pack;
		detail = null;
		detailError = false;
		detailLoading = true;
		try {
			detail = resolvePackDefinition(await getPackDetails(pack.id), variants);
		} catch {
			detailError = true;
		} finally {
			detailLoading = false;
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
		<PackCatalogue {packs} onDetails={showDetails} onOpen={selectPack} />
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
			available={selectedPack.credit?.available ?? 0}
			maximum={selectedPack.credit?.max ?? 0}
			{nextDelay}
			packName={selectedPackName}
			packImage={selectedPack.imageUrl ?? selectedPack.credit?.imageUrl ?? '/images/booster.png'}
			packRenderKey={selectedPack.renderKey ?? 'standard'}
			packCardCount={selectedPack.nbCards}
			{opening}
			canOpenAll={selectedPack.openAll}
			{openingId}
			cards={result}
			error={Boolean(openingError)}
			suspended={Boolean(selectedCard)}
			onOpen={() => void open(false)}
			onOpenAll={() => void open(true)}
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

{#if detailPack}
	<PackDetailDialog
		pack={detailPack}
		details={detail}
		loading={detailLoading}
		error={detailError}
		onClose={() => (detailPack = null)}
		onOpen={() => {
			selectPack(detailPack!);
			detailPack = null;
		}}
	/>
{/if}
