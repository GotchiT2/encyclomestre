<script lang="ts">
	import { page } from '$app/state';
	import {
		publishRealtimeRefresh,
		realtimeRefresh,
		refreshIncludes
	} from '$lib/realtime/resource-refresh';
	import { onMount } from 'svelte';
	import { invalidateArticleContexts } from '$lib/arcade/article-context';
	import { _ } from '$lib/i18n';
	import {
		ApiError,
		isMockApiEnabled,
		addWishlistRegistryCard,
		getBoosterInventory,
		toPackSummaries,
		type BoosterFamilyDto,
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
	import FamilyCredits from '$lib/components/boosters/family-credits.svelte';
	import PackGallery from '$lib/components/boosters/pack-gallery.svelte';
	import { currentSession } from '$lib/auth/session';
	import { getWikiForgeCollectionCard } from '$lib/api/collection';
	import {
		readOpeningReceipt,
		saveOpeningReceipt,
		restoreOpeningCards,
		type OpeningReceipt
	} from '$lib/arcade/opening-receipt';
	import PackDetailDialog from '$lib/components/boosters/pack-detail-dialog.svelte';
	import { packNameKey } from '$lib/components/boosters/pack-labels';
	import {
		formatBoosterDelay,
		getBoosterRefreshDelay
	} from '$lib/components/boosters/booster-countdown';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import TurnstileWidget from '$lib/components/security/turnstile-widget.svelte';
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
	let catalogueGeneration = 0;
	let detailGeneration = 0;
	let catalogueError = $state(false);
	let catalogueLoading = $state(false);
	let revision = 0;
	let openedCount = $state(0);
	let receipt = $state<OpeningReceipt | null>(null);
	let resumeProgress = $state<{ revealed: number; index: number } | null>(null);
	let resuming = $state(false),
		resumeError = $state(false);
	let credits = $state<PackSummary[]>([]);
	let families = $state<BoosterFamilyDto[]>([]);
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
	let turnstile = $state<{ verify: () => Promise<string>; reset: () => void } | null>(null);
	const packs = $derived(
		packDefinitions ? mergePackCatalogue(packDefinitions, credits, families) : null
	);
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
		const generation = ++catalogueGeneration;
		catalogueLoading = true;
		catalogueError = false;
		try {
			const [catalogue, inventory, loadedVariants] = await Promise.all([
				getPacks(),
				getBoosterInventory(),
				getVariants()
			]);
			if (generation !== catalogueGeneration) return;
			packDefinitions = catalogue;
			credits = toPackSummaries(inventory);
			families = inventory.families ?? [];
			variants = loadedVariants;
			if (selectedPackId != null) {
				const refreshed = mergePackCatalogue(
					catalogue,
					toPackSummaries(inventory),
					inventory.families ?? []
				).find((pack) => pack.id === selectedPackId);
				selectedPackSnapshot =
					refreshed ??
					(selectedPackSnapshot
						? { ...selectedPackSnapshot, credit: null, status: 'CLOSED' }
						: null);
			}
		} catch (cause) {
			if (generation === catalogueGeneration) catalogueError = true;
			throw cause;
		} finally {
			if (generation === catalogueGeneration) catalogueLoading = false;
		}
	}

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (revision === refresh.revision || !refreshIncludes(refresh, 'boosters')) return;
		revision = refresh.revision;
		void refreshPacks().catch(() => undefined);
	});
	onMount(() => {
		const clock = window.setInterval(() => (now = Date.now()), 1_000);
		void refreshPacks()
			.then(() => {
				const requested = Number(page.url.searchParams.get('pack'));
				const pack = packs?.find(
					(p) => p.id === requested && p.status === 'OPEN' && p.credit?.available
				);
				const initial =
					pack ?? packs?.find((p) => p.status === 'OPEN' && p.credit?.available) ?? packs?.[0];
				if (initial) selectPack(initial);
				const account = $currentSession?.user.id;
				if (account) receipt = readOpeningReceipt(sessionStorage, account);
			})
			.catch(() => undefined);
		return () => window.clearInterval(clock);
	});

	$effect(() => {
		const delays = families
			.map((family) => getBoosterRefreshDelay(family.nextAvailableAt ?? null))
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
		const openingPack = selectedPack;
		opening = true;
		result = null;
		openingError = null;
		resumeProgress = null;
		const account = $currentSession?.user.id;
		try {
			if (!turnstile) throw new Error('Turnstile unavailable');
			const turnstileToken = await turnstile.verify();
			if ($currentSession?.user.id !== account) return;
			const opened = all
				? await openAllBoosters(openingPack.id, turnstileToken)
				: await openBooster(openingPack.id, turnstileToken);
			if ($currentSession?.user.id !== account) return;
			result = opened.cards;
			openedCount = Math.floor(opened.cards.length / Math.max(1, openingPack.nbCards));
			if (account && result.length) {
				receipt = {
					accountId: account,
					packId: openingPack.id,
					cardIds: result.map((card) => card.id),
					openedCount,
					revealed: 0,
					index: 0
				};
				saveOpeningReceipt(sessionStorage, receipt);
			}
			publishRealtimeRefresh(['collection', 'profile', 'achievements', 'boosters']);
			openingId += 1;
		} catch (error) {
			const code = wikiForgeApiErrorCode(error);
			const captchaRejected =
				code === 'INVALID_CAPTCHA' ||
				code === 'CAPTCHA_REQUIRED' ||
				(error instanceof ApiError &&
					typeof error.payload === 'object' &&
					error.payload !== null &&
					'error' in error.payload &&
					error.payload.error === 'invalid_captcha');
			openingError = ['NO_BOOSTER_AVAILABLE', 'NOT_FOUND', 'PACK_EXHAUSTED'].includes(code ?? '')
				? code!
				: captchaRejected || (error instanceof Error && error.message.includes('Turnstile'))
					? 'CAPTCHA'
					: 'UNKNOWN';
			if (openingError === 'UNKNOWN') publishRealtimeRefresh(['collection', 'profile', 'boosters']);
		} finally {
			turnstile?.reset();
			resetPackDetailsCache();
			await refreshPacks().catch(() => undefined);
			opening = false;
		}
	}

	function selectPack(pack: PackCatalogueItem) {
		if (opening || resuming) return;
		selectedPackId = pack.id;
		selectedPackSnapshot = pack;
		openingError = null;
		result = null;
	}

	async function resumeOpening() {
		if (!receipt || resuming || opening) return;
		const account = $currentSession?.user.id,
			saved = receipt;
		resuming = true;
		resumeError = false;
		try {
			const restored = await restoreOpeningCards(saved, getWikiForgeCollectionCard);
			if ($currentSession?.user.id !== account) return;
			const pack = packs?.find((item) => item.id === saved.packId);
			if (!pack) throw new Error('PACK_UNAVAILABLE');
			selectedPackId = pack.id;
			selectedPackSnapshot = pack;
			openingError = null;
			result = restored;
			openedCount = saved.openedCount;
			resumeProgress = { revealed: saved.revealed, index: saved.index };
			openingId++;
		} catch {
			resumeError = true;
		} finally {
			resuming = false;
		}
	}
	function saveProgress(revealed: number, index: number) {
		if (!receipt || $currentSession?.user.id !== receipt.accountId) return;
		receipt = { ...receipt, revealed, index };
		saveOpeningReceipt(sessionStorage, receipt);
	}

	async function showDetails(pack: PackCatalogueItem) {
		const generation = ++detailGeneration;
		detailPack = pack;
		detail = null;
		detailError = false;
		detailLoading = true;
		try {
			const result = resolvePackDefinition(await getPackDetails(pack.id), variants);
			if (generation === detailGeneration) detail = result;
		} catch {
			if (generation === detailGeneration) detailError = true;
		} finally {
			if (generation === detailGeneration) detailLoading = false;
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
		invalidateArticleContexts();
	}
</script>

{#if receipt && !result}<div
		class="mb-4 flex flex-wrap items-center gap-3 border border-primary p-3"
	>
		<Button disabled={resuming} onclick={resumeOpening}>{$_('arcade.resume')}</Button
		>{#if resumeError}<p role="alert">{$_('arcade.receiptUnavailable')}</p>{/if}
	</div>{/if}
{#if catalogueError}<div role="alert" class="forge-panel mb-4 p-4">
		<p>{$_('plan.loadError')}</p>
		<Button disabled={catalogueLoading} onclick={() => void refreshPacks().catch(() => undefined)}
			>{$_('completion.retry')}</Button
		>
	</div>{/if}
{#if result && !opening}<p role="status" class="mb-4">
		{$_(
			catalogueError || selectedPack?.credit == null
				? 'plan.boosters.openedUnknownCredits'
				: 'plan.boosters.opened',
			{
				values: { count: openedCount, remaining: selectedPack?.credit?.available ?? 0 }
			}
		)}
	</p>{/if}
<section class="flex flex-col gap-4">
	<PageHeader title={$_('boosters.title')} />

	{#if packs === null}
		<div class="forge-panel min-h-[24rem] animate-pulse"></div>
	{:else if !packs.length}
		<div class="forge-panel grid min-h-64 place-items-center p-8 text-center text-muted-foreground">
			{$_('boosters.no_active_packs')}
		</div>
	{:else}
		{#if families.length}<FamilyCredits {families} {now} />{/if}
		<PackGallery {packs} selectedId={selectedPackId} onDetails={showDetails} onSelect={selectPack}>
			{#snippet actions()}{#if selectedPack}
					<div class="mx-auto w-full max-w-sm">
						<TurnstileWidget
							mock={isMockApiEnabled()}
							bind:this={turnstile}
							action="open"
							onError={() => (openingError = 'CAPTCHA')}
						/>
					</div>
					{#if openingError}<p class="text-sm text-destructive" role="alert">
							{$_(
								openingError === 'UNKNOWN'
									? 'arcade.uncertainOpening'
									: `boosters.errors.${openingError}`
							)}
						</p>{/if}

					<BoosterOpeningStage
						showPack={false}
						{openedCount}
						creditKnown={selectedPack.credit != null}
						resume={resumeProgress}
						onProgress={saveProgress}
						available={selectedPack.credit?.available ?? 0}
						regularAvailable={selectedPack.credit?.regularAvailable ?? 0}
						bonusAvailable={selectedPack.credit?.bonus ?? 0}
						maximum={selectedPack.credit?.max ?? 0}
						{nextDelay}
						packName={selectedPackName}
						packImage={selectedPack.imageUrl ??
							selectedPack.credit?.imageUrl ??
							'/images/booster.png'}
						packRenderKey={selectedPack.renderKey ?? 'standard'}
						packCardCount={selectedPack.nbCards}
						{opening}
						canOpenAll={selectedPack.openAll}
						canOpen={selectedPack.status === 'OPEN'}
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
				{/if}{/snippet}</PackGallery
		>
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
