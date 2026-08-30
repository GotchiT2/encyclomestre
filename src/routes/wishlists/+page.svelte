<script lang="ts">
	import { onMount } from 'svelte';
	import {
		acceptWishlistInvitation,
		addWishlistRegistryCard,
		createWishlistRegistry,
		deleteWishlistRegistry,
		getWikiForgePublicPages,
		getWishlistFollowers,
		getWishlistGroups,
		getWishlistPage,
		inviteWishlistFollower,
		leaveWishlist,
		removeWishlistRegistryCard,
		revokeWishlistFollower,
		toPublicPage,
		updateWishlistRegistry
	} from '$lib/api';
	import { wikiForgeApiErrorCode } from '$lib/api/wikiforge-contract';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import WishlistAccessDialog from '$lib/components/wishlist/wishlist-access-dialog.svelte';
	import WishlistHub from '$lib/components/wishlist/wishlist-hub.svelte';
	import WishlistListControls from '$lib/components/wishlist/wishlist-list-controls.svelte';
	import FilterShell from '$lib/components/layout/filter-shell.svelte';
	import WishlistPicker from '$lib/components/wishlist/wishlist-picker.svelte';
	import WishlistRegistryDrawers from '$lib/components/wishlist/wishlist-registry-drawers.svelte';
	import WishlistSocialGrid from '$lib/components/wishlist/wishlist-social-grid.svelte';
	import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';
	import { toast } from 'svelte-sonner';
	import type { CardQuery } from '$lib/api';
	import type {
		CardRarity,
		CardRecord,
		WishlistFollower,
		WishlistGroups,
		WishlistPageEntry,
		WishlistRegistrySummary,
		WishlistSort
	} from '$lib/types';

	const emptyGroups: WishlistGroups = { owned: [], shared: [], pending: [] };
	let groups = $state<WishlistGroups>(emptyGroups);
	let activeWishlist = $state<WishlistRegistrySummary | null>(null);
	let entries = $state<WishlistPageEntry[]>([]);
	let followers = $state<WishlistFollower[]>([]);
	let query = $state('');
	let rarities = $state<CardRarity[]>([]);
	let sortBy = $state<WishlistSort>('date');
	let sortDirection = $state<'ASC' | 'DESC'>('DESC');
	let page = $state(1);
	let total = $state(0);
	let totalPages = $state(1);
	let loading = $state(true);
	let listLoading = $state(false);
	let groupsFailed = $state(false);
	let entriesFailed = $state(false);
	let pickerOpen = $state(false);
	let illustrationPickerOpen = $state(false);
	let illustrationMode = $state<'create' | 'edit'>('create');
	let createImage = $state<CardRecord | null>(null);
	let editImage = $state<CardRecord | null>(null);
	let pickerAddedCardIds = $state<string[]>([]);
	let accessOpen = $state(false);
	let createOpen = $state(false);
	let editOpen = $state(false);
	let deleteOpen = $state(false);
	let editingWishlist = $state<WishlistRegistrySummary | null>(null);
	let deletingWishlist = $state<WishlistRegistrySummary | null>(null);
	let selectedCard = $state<CardRecord | null>(null);
	let ready = $state(false);
	let requestId = 0;
	let debounceTimer: number | undefined;
	const filterKey = $derived(
		JSON.stringify([activeWishlist?.id, query, rarities, sortBy, sortDirection, page])
	);
	let previousFilterKey = $state('');
	const editable = $derived(activeWishlist?.access === 'owned');

	async function refreshGroups(preferredId = activeWishlist?.id) {
		groups = await getWishlistGroups();
		const selectable = [...groups.owned, ...groups.shared];
		activeWishlist =
			selectable.find((wishlist) => wishlist.id === preferredId) ?? selectable[0] ?? null;
	}

	async function loadEntries() {
		if (!activeWishlist) {
			entries = [];
			total = 0;
			totalPages = 1;
			return;
		}
		const currentRequest = ++requestId;
		listLoading = true;
		entriesFailed = false;
		try {
			const result = await getWishlistPage(activeWishlist.id, {
				page,
				query: query.trim() || undefined,
				rarities,
				sortBy,
				sortDirection
			});
			if (currentRequest !== requestId) return;
			entries = result.items;
			total = result.meta.total;
			totalPages = result.meta.totalPages;
		} catch {
			if (currentRequest === requestId) entriesFailed = true;
		} finally {
			if (currentRequest === requestId) listLoading = false;
		}
	}

	$effect(() => {
		if (!ready) return;
		void filterKey;
		window.clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => void loadEntries(), query.trim() ? 500 : 0);
		return () => window.clearTimeout(debounceTimer);
	});

	async function loadGroups() {
		loading = true;
		groupsFailed = false;
		try {
			await refreshGroups();
		} catch {
			groupsFailed = true;
		} finally {
			loading = false;
			ready = true;
		}
	}

	onMount(loadGroups);

	function selectWishlist(wishlist: WishlistRegistrySummary) {
		activeWishlist = wishlist;
		query = '';
		rarities = [];
		page = 1;
	}

	function resetPage() {
		const nextKey = JSON.stringify([activeWishlist?.id, query, rarities, sortBy, sortDirection]);
		if (nextKey !== previousFilterKey) {
			previousFilterKey = nextKey;
			page = 1;
		}
	}

	async function create(title: string, description: string, imagePageId: string | null) {
		const created = await createWishlistRegistry('', { title, description, imagePageId });
		createImage = null;
		await refreshGroups(created.id);
	}

	async function update(title: string, description: string, imagePageId: string | null) {
		if (!editingWishlist) return;
		const updated = await updateWishlistRegistry(editingWishlist.id, {
			title,
			description,
			imagePageId
		});
		editImage = null;
		editingWishlist = null;
		await refreshGroups(updated.id);
	}

	async function removeWishlist() {
		if (!deletingWishlist) return;
		await deleteWishlistRegistry(deletingWishlist.id);
		deletingWishlist = null;
		deleteOpen = false;
		await refreshGroups();
	}

	async function addCard(card: CardRecord) {
		if (!activeWishlist || !editable) return;
		const wishlist = activeWishlist;
		const pageId = String(card.baseCardId ?? card.id);
		try {
			await addWishlistRegistryCard(wishlist.id, '', pageId);
		} catch (error) {
			if (wikiForgeApiErrorCode(error) === 'WISHLIST_FULL') {
				toast.error($_('wishlist.full_error'));
				return;
			}
			throw error;
		}
		if (!pickerAddedCardIds.includes(pageId)) {
			pickerAddedCardIds = [...pickerAddedCardIds, pageId];
		}
		toast.success(
			$_('wishlist.card_added', {
				values: { card: card.title, wishlist: wishlist.title }
			})
		);
		await Promise.all([refreshGroups(wishlist.id), loadEntries()]);
	}

	function openPicker() {
		pickerAddedCardIds = [];
		pickerOpen = true;
	}

	async function removeCard(pageId: string) {
		if (!activeWishlist || !editable) return;
		await removeWishlistRegistryCard(activeWishlist.id, '', pageId);
		await Promise.all([refreshGroups(activeWishlist.id), loadEntries()]);
		if (selectedCard && String(selectedCard.baseCardId ?? selectedCard.id) === pageId) {
			selectedCard = null;
		}
	}

	async function accept(wishlist: WishlistRegistrySummary) {
		try {
			await acceptWishlistInvitation(wishlist.id);
			await refreshGroups(wishlist.id);
		} catch (error) {
			if (wikiForgeApiErrorCode(error) !== 'NOT_FOUND') throw error;
			toast.error($_('wishlist.invitation_expired'));
			await refreshGroups();
		}
	}

	async function leave(wishlist: WishlistRegistrySummary) {
		await leaveWishlist(wishlist.id);
		await refreshGroups();
	}

	async function openAccess() {
		if (!activeWishlist || !editable) return;
		followers = await getWishlistFollowers(activeWishlist.id);
		accessOpen = true;
	}

	async function invite(userId: string) {
		if (!activeWishlist) return;
		await inviteWishlistFollower(activeWishlist.id, userId);
		followers = await getWishlistFollowers(activeWishlist.id);
	}

	async function revoke(userId: string) {
		if (!activeWishlist) return;
		await revokeWishlistFollower(activeWishlist.id, userId);
		followers = await getWishlistFollowers(activeWishlist.id);
	}

	async function loadCandidateCards(cardQuery: CardQuery) {
		return toPublicPage(
			await getWikiForgePublicPages({
				page: Math.max(0, (cardQuery.page ?? 1) - 1),
				q: cardQuery.query,
				rarities: (cardQuery.rarities ?? []).map((rarity) => cardRarityCodeByName[rarity]),
				sortBy: cardQuery.sortBy,
				sortDirection: cardQuery.sortDirection
			})
		);
	}

	async function addCardFromDetail(wishlistId: string, selected: boolean) {
		if (!selected || !selectedCard) return;
		try {
			await addWishlistRegistryCard(
				wishlistId,
				'',
				String(selectedCard.baseCardId ?? selectedCard.id)
			);
		} catch (error) {
			if (wikiForgeApiErrorCode(error) === 'WISHLIST_FULL') {
				toast.error($_('wishlist.full_error'));
				return;
			}
			throw error;
		}
		await refreshGroups(activeWishlist?.id);
	}

	function openIllustrationPicker(mode: 'create' | 'edit') {
		illustrationMode = mode;
		illustrationPickerOpen = true;
	}

	function selectIllustration(card: CardRecord) {
		if (illustrationMode === 'create') createImage = card;
		else editImage = card;
		illustrationPickerOpen = false;
	}
	const activeFilterCount = $derived(
		(query ? 1 : 0) +
			rarities.length +
			(sortBy !== 'date' ? 1 : 0) +
			(sortDirection === 'ASC' ? 1 : 0)
	);
</script>

<section class="flex flex-col gap-6 pb-12 sm:gap-8">
	<PageHeader
		eyebrow={$_('wishlist.registry')}
		title={$_('wishlist.hub_title')}
		description={$_('wishlist.description')}
	/>
	{#if loading}
		<p class="forge-label">{$_('wishlist.loading')}</p>
	{:else if groupsFailed && !activeWishlist}
		<div class="forge-panel-flat flex flex-wrap items-center justify-between gap-3 p-4">
			<p class="text-destructive">{$_('wishlist.groups_load_error')}</p>
			<Button variant="outline" onclick={() => void loadGroups()}>{$_('common.retry')}</Button>
		</div>
	{:else}
		<WishlistHub
			{groups}
			activeId={activeWishlist?.id ?? null}
			onSelect={selectWishlist}
			onCreate={() => (createOpen = true)}
			onEdit={(wishlist) => {
				editingWishlist = wishlist;
				editImage = null;
				editOpen = true;
			}}
			onDelete={(wishlist) => {
				deletingWishlist = wishlist;
				deleteOpen = true;
			}}
			onAccept={accept}
			onDecline={leave}
			onLeave={leave}
		/>

		{#if activeWishlist}
			<section class="grid gap-4 border-t border-primary/25 pt-5">
				<header class="flex flex-wrap items-end justify-between gap-3">
					<div>
						{#if activeWishlist.imageUrl}
							<img
								src={activeWishlist.imageUrl}
								alt=""
								class="mb-3 h-24 w-full max-w-sm border border-primary/30 object-cover sm:h-28"
								referrerpolicy="no-referrer"
							/>
						{/if}
						<p class="forge-label">
							{activeWishlist.access === 'owned'
								? $_('wishlist.owned_list')
								: $_('wishlist.shared_list')}
						</p>
						<h2 class="text-3xl font-black uppercase">{activeWishlist.title}</h2>
						{#if activeWishlist.description}<p class="mt-2 italic text-muted-foreground">
								{activeWishlist.description}
							</p>{/if}
					</div>
					{#if editable}
						<div class="flex flex-wrap gap-2">
							<Button variant="outline" onclick={() => void openAccess()}
								>{$_('wishlist.manage_access')}</Button
							>
							<Button onclick={openPicker}>{$_('wishlist.add_card_action')}</Button>
						</div>
					{/if}
				</header>

				<div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
					<FilterShell activeCount={activeFilterCount}>
						<WishlistListControls
							bind:query
							bind:rarities
							bind:sortBy
							bind:sortDirection
							onChange={resetPage}
						/>
					</FilterShell>

					<div class="flex min-w-0 flex-col gap-4">
						<p class="forge-label">{$_('wishlist.results_count', { values: { count: total } })}</p>
						{#if listLoading}
							<p class="forge-label">{$_('wishlist.loading')}</p>
						{:else if entriesFailed}
							<div class="forge-panel-flat flex flex-wrap items-center justify-between gap-3 p-4">
								<p class="text-destructive">{$_('wishlist.cards_load_error')}</p>
								<Button variant="outline" onclick={() => void loadEntries()}
									>{$_('common.retry')}</Button
								>
							</div>
						{:else}
							<WishlistSocialGrid
								{entries}
								{editable}
								onRemove={removeCard}
								onOpen={(entry) => (selectedCard = entry.card)}
							/>
							<nav
								class="flex items-center justify-between border-t border-primary/20 pt-4"
								aria-label={$_('wishlist.page')}
							>
								<Button variant="outline" disabled={page <= 1} onclick={() => (page -= 1)}
									>{$_('common.previous')}</Button
								>
								<span class="forge-label">{page} / {totalPages}</span>
								<Button variant="outline" disabled={page >= totalPages} onclick={() => (page += 1)}
									>{$_('common.next')}</Button
								>
							</nav>
						{/if}
					</div>
				</div>
			</section>
		{/if}
	{/if}
</section>

<WishlistPicker
	bind:open={pickerOpen}
	existingCardIds={[
		...entries.map((entry) => String(entry.card.baseCardId ?? entry.card.id)),
		...pickerAddedCardIds
	]}
	loadCards={loadCandidateCards}
	onSelect={addCard}
/>
<WishlistRegistryDrawers
	bind:createOpen
	bind:editOpen
	bind:deleteOpen
	registry={editingWishlist ?? deletingWishlist}
	createImage={createImage
		? {
				title: createImage.title,
				imageUrl: createImage.imageUrl,
				pageId: String(createImage.baseCardId ?? createImage.id)
			}
		: null}
	editImage={editImage
		? {
				title: editImage.title,
				imageUrl: editImage.imageUrl,
				pageId: String(editImage.baseCardId ?? editImage.id)
			}
		: null}
	onPickCreateImage={() => openIllustrationPicker('create')}
	onPickEditImage={() => openIllustrationPicker('edit')}
	onCreate={create}
	onUpdate={update}
	onDelete={removeWishlist}
/>
<WishlistPicker
	bind:open={illustrationPickerOpen}
	existingCardIds={[]}
	loadCards={loadCandidateCards}
	onSelect={selectIllustration}
/>
<WishlistAccessDialog bind:open={accessOpen} {followers} onInvite={invite} onRevoke={revoke} />
{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		wishlists={groups.owned}
		loadVariantCopies={false}
		onToggleWishlist={addCardFromDetail}
		onClose={() => (selectedCard = null)}
	/>
{/if}
