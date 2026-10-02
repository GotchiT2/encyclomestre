<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { getFriends } from '$lib/api/users';
	import { operationError } from '$lib/domain/operation-error';
	import { page as route } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		acceptWishlistInvitation,
		addWishlistRegistryCard,
		addWishlistRegistryCards,
		createWishlistRegistry,
		deleteWishlistRegistry,
		getWikiForgePublicPages,
		getWishlistFollowers,
		getWishlistGroups,
		getWishlistPage,
		inviteWishlistFollower,
		leaveWishlist,
		removeWishlistRegistryCard,
		removeWishlistRegistryCards,
		removeOwnedWishlistRegistryCards,
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
	import { invalidateArticleContexts } from '$lib/arcade/article-context';
	import { _ } from '$lib/i18n';
	import { toast } from 'svelte-sonner';
	import type { CardQuery } from '$lib/api';
	import type {
		CardRecord,
		WishlistFollower,
		WishlistGroups,
		WishlistPageEntry,
		WishlistRegistrySummary,
		WishlistSort,
		User
	} from '$lib/types';

	const emptyGroups: WishlistGroups = { owned: [], shared: [], pending: [] };
	let friends = $state<User[]>([]);
	let groups = $state<WishlistGroups>(emptyGroups);
	let activeWishlist = $state<WishlistRegistrySummary | null>(null);
	let entries = $state<WishlistPageEntry[]>([]);
	let followers = $state<WishlistFollower[]>([]);
	let query = $state('');
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
	let selectedPageIds = $state<string[]>([]);
	let selectionMode = $state(false);
	let cleaningOwned = $state(false);
	let removingSelection = $state(false);
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
		JSON.stringify([activeWishlist?.id, query, sortBy, sortDirection, page])
	);
	let previousFilterKey = $state('');
	const editable = $derived(activeWishlist?.access === 'owned');

	async function refreshGroups(preferredId = activeWishlist?.id) {
		groups = await getWishlistGroups();
		invalidateArticleContexts();
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
		const requestedFilter = filterKey;
		listLoading = true;
		entriesFailed = false;
		try {
			const result = await getWishlistPage(activeWishlist.id, {
				page,
				query: query.trim() || undefined,
				sortBy,
				sortDirection
			});
			if (currentRequest !== requestId || requestedFilter !== filterKey) return;
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
		const url = new URL(window.location.href);
		for (const [key, value] of Object.entries({
			list: activeWishlist?.id ?? '',
			q: query,
			sort: sortBy,
			direction: sortDirection,
			page: String(page)
		})) {
			if (value) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- updating filters on the current URL
		replaceState(url, route.state);
		window.clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => void loadEntries(), query.trim() ? 500 : 0);
		return () => window.clearTimeout(debounceTimer);
	});

	async function loadGroups() {
		loading = true;
		groupsFailed = false;
		try {
			await refreshGroups(route.url.searchParams.get('list') ?? undefined);
			query = route.url.searchParams.get('q') ?? '';
			sortBy = route.url.searchParams.get('sort') === 'name' ? 'name' : 'date';
			sortDirection = route.url.searchParams.get('direction') === 'ASC' ? 'ASC' : 'DESC';
			page = Math.max(1, Math.trunc(Number(route.url.searchParams.get('page'))) || 1);
			previousFilterKey = JSON.stringify([activeWishlist?.id, query, sortBy, sortDirection]);
		} catch {
			groupsFailed = true;
		} finally {
			loading = false;
			ready = true;
		}
	}

	onMount(() => {
		void loadGroups();
		void getFriends()
			.then(
				(items) =>
					(friends = items.filter((item) => item.status === 'accepted').map((item) => item.user))
			)
			.catch(() => undefined);
	});

	function selectWishlist(wishlist: WishlistRegistrySummary) {
		activeWishlist = wishlist;
		query = '';
		page = 1;
		selectedPageIds = [];
		selectionMode = false;
	}

	function resetPage() {
		const nextKey = JSON.stringify([activeWishlist?.id, query, sortBy, sortDirection]);
		if (nextKey !== previousFilterKey) {
			previousFilterKey = nextKey;
			page = 1;
		}
	}

	async function create(
		title: string,
		description: string,
		imagePageId: string | null,
		sharedWithGuild = false
	) {
		const created = await createWishlistRegistry('', {
			title,
			description,
			imagePageId,
			sharedWithGuild
		});
		createImage = null;
		await refreshGroups(created.id);
	}

	async function update(
		title: string,
		description: string,
		imagePageId: string | null,
		sharedWithGuild = false
	) {
		if (!editingWishlist) return;
		const updated = await updateWishlistRegistry(editingWishlist.id, {
			title,
			description,
			imagePageId,
			sharedWithGuild
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
		await addWishlistRegistryCard(wishlist.id, '', pageId);
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

	async function addCards(cards: CardRecord[]) {
		if (!activeWishlist || !editable || !cards.length) return;
		const wishlist = activeWishlist;
		const pageIds = cards.map((card) => String(card.baseCardId ?? card.id));
		await addWishlistRegistryCards(wishlist.id, pageIds);
		pickerAddedCardIds = [...new Set([...pickerAddedCardIds, ...pageIds])];
		toast.success(
			$_('wishlist.cards_added', { values: { count: pageIds.length, wishlist: wishlist.title } })
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

	function toggleSelection(pageId: string) {
		selectedPageIds = selectedPageIds.includes(pageId)
			? selectedPageIds.filter((id) => id !== pageId)
			: [...selectedPageIds, pageId].slice(0, 500);
	}

	async function removeSelection() {
		if (removingSelection || !activeWishlist || !editable || !selectedPageIds.length) return;
		removingSelection = true;
		try {
			await removeWishlistRegistryCards(activeWishlist.id, selectedPageIds);
			selectedPageIds = [];
			selectionMode = false;
			await Promise.all([refreshGroups(activeWishlist.id), loadEntries()]);
		} catch (cause) {
			toast.error(operationError(cause));
		} finally {
			removingSelection = false;
		}
	}

	async function cleanOwnedCards() {
		if (cleaningOwned || !activeWishlist || !editable) return;
		if (!window.confirm($_('wishlist.clean_owned_confirm'))) return;
		cleaningOwned = true;
		try {
			await removeOwnedWishlistRegistryCards(activeWishlist.id);
			await Promise.all([refreshGroups(activeWishlist.id), loadEntries()]);
			toast.success($_('wishlist.clean_owned_success'));
		} catch (cause) {
			toast.error(operationError(cause));
		} finally {
			cleaningOwned = false;
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
		const id = activeWishlist.id;
		try {
			const result = await getWishlistFollowers(id);
			if (activeWishlist?.id !== id) return;
			followers = result;
			accessOpen = true;
		} catch (cause) {
			toast.error(operationError(cause));
		}
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
				sortBy: cardQuery.sortBy,
				sortDirection: cardQuery.sortDirection
			})
		);
	}

	async function addCardFromDetail(wishlistId: string, selected: boolean) {
		if (!selected || !selectedCard) return;
		await addWishlistRegistryCard(
			wishlistId,
			'',
			String(selectedCard.baseCardId ?? selectedCard.id)
		);
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
		(query ? 1 : 0) + (sortBy !== 'date' ? 1 : 0) + (sortDirection === 'ASC' ? 1 : 0)
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
		<div class="flex flex-wrap gap-3">
			<Button
				variant="outline"
				href={'/market?wishlist=' + encodeURIComponent($currentSession?.user.id ?? '')}
				>{$_('plan.auctions.wanted')}</Button
			>{#if friends.length}<label class="grid min-w-0 gap-1 text-sm"
					><span>{$_('plan.wishlist.friendCollection')}</span><select
						aria-label={$_('plan.wishlist.friendCollection')}
						onchange={(event) => {
							if (event.currentTarget.value)
								location.assign(
									'/users/' +
										encodeURIComponent(event.currentTarget.value) +
										'?wishlist=mine&tab=collection'
								);
						}}
						><option value="">{$_('completion.choose')}</option
						>{#each friends as friend (friend.id)}<option value={friend.id}
								>{friend.username}</option
							>{/each}</select
					></label
				>{/if}
		</div>
		<div class="wishlist-workbench">
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
				onAccept={(wishlist) =>
					accept(wishlist).catch((cause) => {
						toast.error(operationError(cause));
					})}
				onDecline={(wishlist) =>
					leave(wishlist).catch((cause) => {
						toast.error(operationError(cause));
					})}
				onLeave={(wishlist) =>
					leave(wishlist).catch((cause) => {
						toast.error(operationError(cause));
					})}
			/>

			<div class="wishlist-content">
				{#if activeWishlist}
					<section class="grid gap-4 border-t border-primary/25 pt-5">
						<header class="flex flex-wrap items-end justify-between gap-3">
							<div>
								{#if activeWishlist.imageUrl}
									<img
										src={activeWishlist.imageUrl}
										alt=""
										class="mb-2 size-12 border border-primary/30 object-cover"
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
									<Button variant="outline" onclick={() => (selectionMode = !selectionMode)}
										>{selectionMode
											? $_('wishlist.cancel_selection')
											: $_('wishlist.select_cards')}</Button
									>
									<Button
										variant="outline"
										disabled={cleaningOwned}
										onclick={() => void cleanOwnedCards()}>{$_('wishlist.clean_owned')}</Button
									>
								</div>
							{/if}
						</header>

						<div class="grid gap-6">
							<FilterShell activeCount={activeFilterCount}>
								<WishlistListControls
									bind:query
									bind:sortBy
									bind:sortDirection
									onChange={resetPage}
								/>
							</FilterShell>

							<div class="flex min-w-0 flex-col gap-4">
								<p class="forge-label">
									{$_('wishlist.results_count', { values: { count: total } })}
								</p>
								{#if listLoading && !entries.length}
									<p class="forge-label">{$_('wishlist.loading')}</p>
								{:else if entriesFailed}
									<div
										class="forge-panel-flat flex flex-wrap items-center justify-between gap-3 p-4"
									>
										<p class="text-destructive">{$_('wishlist.cards_load_error')}</p>
										<Button variant="outline" onclick={() => void loadEntries()}
											>{$_('common.retry')}</Button
										>
									</div>
								{:else}
									<WishlistSocialGrid
										{entries}
										{editable}
										{selectionMode}
										{selectedPageIds}
										onRemove={(id) =>
											removeCard(id).catch((cause) => {
												toast.error(operationError(cause));
											})}
										onToggleSelection={toggleSelection}
										onOpen={(entry) => (selectedCard = entry.card)}
									/>
									{#if selectionMode}
										<div
											class="flex items-center justify-between gap-3 border border-energy/30 bg-energy/10 p-3"
										>
											<p class="forge-label text-energy">
												{$_('wishlist.selected_cards', {
													values: { count: selectedPageIds.length }
												})}
											</p>
											<Button
												variant="destructive"
												disabled={!selectedPageIds.length || removingSelection}
												onclick={() => void removeSelection()}
												>{$_('wishlist.remove_selected')}</Button
											>
										</div>
									{/if}
									<nav
										class="flex items-center justify-between border-t border-primary/20 pt-4"
										aria-label={$_('wishlist.page')}
									>
										<Button
											variant="outline"
											disabled={listLoading || page <= 1}
											onclick={() => (page -= 1)}>{$_('common.previous')}</Button
										>
										<span class="forge-label">{page} / {totalPages}</span>
										<Button
											variant="outline"
											disabled={listLoading || page >= totalPages}
											onclick={() => (page += 1)}>{$_('common.next')}</Button
										>
									</nav>
								{/if}
							</div>
						</div>
					</section>
				{/if}
			</div>
		</div>
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
	onSelectMany={addCards}
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
		onToggleWishlist={addCardFromDetail}
		onClose={() => (selectedCard = null)}
	/>
{/if}

<style>
	.wishlist-workbench {
		display: grid;
		gap: 24px;
		min-width: 0;
	}
	.wishlist-content {
		min-width: 0;
	}
	.wishlist-content :global(.wikiforge-card-grid) {
		grid-template-columns: repeat(auto-fill, minmax(min(136px, 100%), 1fr));
	}
	@media (min-width: 1024px) {
		.wishlist-workbench {
			grid-template-columns: 240px minmax(0, 1fr);
			align-items: start;
		}
	}
</style>
