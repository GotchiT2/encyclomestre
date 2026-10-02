<script lang="ts">
	import { page } from '$app/state';
	import {
		publishRealtimeRefresh,
		realtimeRefresh,
		refreshIncludes
	} from '$lib/realtime/resource-refresh';
	import { onMount, tick, untrack } from 'svelte';
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
	import { getWikiForgeCollectionCard, getWikiForgeCollectionPage } from '$lib/api/collection';
	import {
		readOpeningReceipt,
		saveOpeningReceipt,
		restoreOpeningCards,
		type OpeningReceipt
	} from '$lib/arcade/opening-receipt';
	import PackDetailDialog from '$lib/components/boosters/pack-detail-dialog.svelte';
	import { packNameKey } from '$lib/components/boosters/pack-labels';
	import { getBoosterRefreshDelay } from '$lib/components/boosters/booster-countdown';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import TurnstileWidget from '$lib/components/security/turnstile-widget.svelte';
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
	let resumeProgress = $state<{ revealedIds: string[]; page: number } | null>(null);
	let sceneOpen = $state(false),
		mounted = $state(false);
	let requestPhase = $state<'verify' | 'request'>('verify');
	let openingSnapshot = $state<PackCatalogueItem | null>(null);
	let resultPackId = $state<number | null>(null);
	let openingEpoch = 0;
	const accountId = $derived($currentSession?.user.id);
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
	const selectedPackName = $derived.by(() => {
		const pack = scenePack;
		if (!pack) return $_('opening.unknownPack');
		const key = packNameKey(pack.name);
		return key ? $_(key) : pack.credit?.name || pack.name;
	});
	const scenePack = $derived(resultPackId != null ? openingSnapshot : selectedPack);
	const sceneCredit = $derived(
		packs?.find((pack) => pack.id === (resultPackId ?? selectedPackId))?.credit ?? null
	);
	const errorMessage = $derived(
		openingError
			? $_(
					openingError === 'UNKNOWN'
						? 'arcade.uncertainOpening'
						: openingError === 'CONFLICT'
							? 'opening.conflict'
							: `boosters.errors.${openingError}`
				)
			: ''
	);

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
		mounted = true;
		const clock = window.setInterval(() => (now = Date.now()), 1_000);
		return () => {
			mounted = false;
			catalogueGeneration++;
			detailGeneration++;
			window.clearInterval(clock);
		};
	});
	$effect(() => {
		const account = accountId;
		if (!mounted || !account) return;
		untrack(() => {
			openingEpoch++;
			opening = false;
			sceneOpen = false;
			result = null;
			openingSnapshot = null;
			resultPackId = null;
			selectedPackId = null;
			selectedCard = null;
			detailDependenciesLoaded = false;
			tags = [];
			wishlists = [];
			assignments = {};
			receipt = readOpeningReceipt(sessionStorage, account);
			void refreshPacks()
				.then(() => {
					if (!mounted || $currentSession?.user.id !== account) return;
					const requested = Number(page.url.searchParams.get('pack'));
					const pack = packs?.find(
						(p) => p.id === requested && p.status === 'OPEN' && p.credit?.available
					);
					const initial =
						pack ?? packs?.find((p) => p.status === 'OPEN' && p.credit?.available) ?? packs?.[0];
					if (initial) selectPack(initial);
				})
				.catch(() => undefined);
		});
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
		const openingPack = packs?.find(
			(pack) => pack.id === (sceneOpen ? scenePack?.id : selectedPack?.id)
		);
		if (
			!openingPack?.credit?.available ||
			openingPack.status !== 'OPEN' ||
			opening ||
			catalogueError
		)
			return;
		const epoch = ++openingEpoch;
		openingSnapshot = openingPack;
		resultPackId = openingPack.id;
		sceneOpen = true;
		requestPhase = 'verify';
		opening = true;
		result = null;
		openingError = null;
		resumeProgress = null;
		const account = $currentSession?.user.id;
		try {
			await tick();
			if (!turnstile) throw new Error('Turnstile unavailable');
			const turnstileToken = await turnstile.verify();
			if ($currentSession?.user.id !== account || epoch !== openingEpoch) return;
			requestPhase = 'request';
			const opened = all
				? await openAllBoosters(openingPack.id, turnstileToken)
				: await openBooster(openingPack.id, turnstileToken);
			if ($currentSession?.user.id !== account || epoch !== openingEpoch) return;
			if (!opened.cards.length) throw new Error('EMPTY_OPENING_RESULT');
			result = opened.cards;
			openedCount = Math.floor(opened.cards.length / Math.max(1, openingPack.nbCards));
			if (account && result.length) {
				receipt = {
					accountId: account,
					packId: openingPack.id,
					cardIds: result.map((card) => card.id),
					openedCount,
					revealedIds: [],
					page: 0
				};
				saveOpeningReceipt(sessionStorage, receipt);
			}
			publishRealtimeRefresh(['collection', 'profile', 'achievements', 'boosters']);
			openingId += 1;
		} catch (error) {
			if ($currentSession?.user.id !== account || epoch !== openingEpoch) return;
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
				: error instanceof ApiError && error.status === 409
					? 'CONFLICT'
					: captchaRejected || (error instanceof Error && error.message.includes('Turnstile'))
						? 'CAPTCHA'
						: 'UNKNOWN';
			if (openingError === 'UNKNOWN') {
				publishRealtimeRefresh(['collection', 'profile', 'boosters']);
				// Refresh acquisitions as well as credits; this read never recreates a lost opening.
				await getWikiForgeCollectionPage({ sortBy: 'acquiredDate' }).catch(() => undefined);
			}
		} finally {
			if ($currentSession?.user.id === account && epoch === openingEpoch) {
				turnstile?.reset();
				resetPackDetailsCache();
				if (mounted) await refreshPacks().catch(() => undefined);
				opening = false;
			}
		}
	}

	function selectPack(pack: PackCatalogueItem) {
		if (opening || resuming) return;
		selectedPackId = pack.id;
		selectedPackSnapshot = pack;
		openingError = null;
		result = null;
		openingSnapshot = null;
		resultPackId = null;
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
			if (pack) {
				selectedPackId = pack.id;
				selectedPackSnapshot = pack;
			}
			openingSnapshot = pack ?? null;
			resultPackId = saved.packId;
			openingError = null;
			result = restored;
			openedCount = saved.openedCount;
			resumeProgress = { revealedIds: saved.revealedIds, page: saved.page };
			openingId++;
			sceneOpen = true;
		} catch {
			resumeError = true;
		} finally {
			resuming = false;
		}
	}
	function saveProgress(revealedIds: string[], resultPage: number) {
		if (!receipt || $currentSession?.user.id !== receipt.accountId) return;
		receipt = { ...receipt, revealedIds, page: resultPage };
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

<svelte:head><title>{$_('opening.title')} · {$_('navigation.brand')}</title></svelte:head>
{#if receipt && !sceneOpen && !opening}<div class="resume-opening">
		<div>
			<p>{$_('opening.saved')}</p>
			<span
				>{$_('arcade.revealed', {
					values: { count: receipt.revealedIds.length, total: receipt.cardIds.length }
				})}</span
			>
		</div>
		<Button disabled={resuming} onclick={resumeOpening}>{$_('arcade.resume')}</Button
		>{#if resumeError}<p role="alert">{$_('arcade.receiptUnavailable')}</p>{/if}
	</div>{/if}
{#if catalogueError}<div role="alert" class="forge-panel mb-4 p-4">
		<p>{$_('plan.loadError')}</p>
		<Button disabled={catalogueLoading} onclick={() => void refreshPacks().catch(() => undefined)}
			>{$_('completion.retry')}</Button
		>
	</div>{/if}
{#if packs === null}<section class="booster-loading" aria-busy={catalogueLoading}>
		<h1>{$_('opening.title')}</h1>
		<p role="status">{$_(catalogueError ? 'plan.loadError' : 'completion.loading')}</p>
	</section>
{:else}
	<PackGallery
		{packs}
		selectedId={selectedPackId}
		onDetails={showDetails}
		onSelect={selectPack}
		locked={opening || resuming || sceneOpen}
		active={!sceneOpen}
		onTear={() => void open(false)}
	>
		{#snippet credits()}{#if families.length}<FamilyCredits {families} {now} />{/if}{/snippet}
		{#snippet actions()}<BoosterOpeningStage
				bind:sceneOpen
				{openedCount}
				creditKnown={!catalogueError && sceneCredit != null}
				resume={resumeProgress}
				onProgress={saveProgress}
				available={sceneCredit?.available ?? 0}
				packName={selectedPackName}
				packRenderKey={scenePack?.renderKey}
				packFamily={scenePack?.family}
				packCardCount={scenePack?.nbCards ?? 0}
				{opening}
				{requestPhase}
				canOpenAll={scenePack?.openAll ?? false}
				canOpen={!catalogueError && scenePack?.status === 'OPEN'}
				{openingId}
				cards={result}
				error={errorMessage}
				suspended={Boolean(selectedCard)}
				onOpen={() => void open(false)}
				onOpenAll={() => void open(true)}
				onOpenCard={openCardDetail}
				onReset={() => (sceneOpen = false)}
			>
				{#snippet verification()}<TurnstileWidget
						mock={isMockApiEnabled()}
						bind:this={turnstile}
						action="open"
						onError={() => (openingError = 'CAPTCHA')}
					/>{/snippet}
			</BoosterOpeningStage>{/snippet}
	</PackGallery>
{/if}

{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		owned
		{wishlists}
		bind:tags
		bind:assignments
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!, selected)}
		onClose={() => {
			const id = selectedCard!.id,
				account = $currentSession?.user.id;
			selectedCard = null;
			void getWikiForgeCollectionCard(id)
				.then((updated) => {
					if ($currentSession?.user.id === account)
						result = result?.map((card) => (card.id === id ? updated : card)) ?? null;
				})
				.catch(() => undefined);
		}}
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

<style>
	.resume-opening {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;
		padding: 12px 16px;
		border: 1px solid #e8ef4266;
		background: #e8ef4206;
	}
	.resume-opening p {
		font-size: 14px;
		font-weight: 600;
	}
	.resume-opening span {
		font-size: 12px;
		color: var(--muted-foreground);
	}
	.booster-loading {
		display: grid;
		place-content: center;
		min-height: 420px;
		gap: 16px;
		text-align: center;
		border: 1px solid var(--border);
	}
</style>
