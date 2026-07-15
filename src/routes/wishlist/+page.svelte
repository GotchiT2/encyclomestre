<script lang="ts">
	import { onMount } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import {
		addWishlistEntry,
		addWishlistRegistryCard,
		getCard,
		getCards,
		getWishlist,
		getWishlistAlerts,
		getWishlists,
		removeWishlistEntry,
		removeWishlistRegistryCard,
		updateWishlistEntry
	} from '$lib/api';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import WishlistControls from '$lib/components/wishlist/wishlist-controls.svelte';
	import WishlistEditor from '$lib/components/wishlist/wishlist-editor.svelte';
	import WishlistPicker from '$lib/components/wishlist/wishlist-picker.svelte';
	import WishlistRegistry, {
		type WishlistCard
	} from '$lib/components/wishlist/wishlist-registry.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type {
		CardRarity,
		CardRecord,
		CardVariant,
		WishlistAlert,
		WishlistEntry,
		WishlistPriority,
		WishlistRegistrySummary
	} from '$lib/types';

	const pageSize = 12;
	let userId = $state('demo-user');
	let cards = $state<CardRecord[]>([]);
	let entries = $state<WishlistEntry[]>([]);
	let alerts = $state<WishlistAlert[]>([]);
	let query = $state('');
	let selectedRarities = $state<CardRarity[]>([]);
	let priority = $state<WishlistPriority | ''>('');
	let hasAlert = $state(false);
	let variant = $state<CardVariant>('all');
	let page = $state(1);
	let pickerOpen = $state(false);
	let editorOpen = $state(false);
	let editingEntry = $state<WishlistEntry | null>(null);
	let selectedCard = $state<CardRecord | null>(null);
	let wishlists = $state<WishlistRegistrySummary[]>([]);
	let loading = $state(true);
	let failed = $state(false);
	let wishlistsLoaded = false;

	const visibleEntries = $derived(
		entries.filter((entry) => {
			const card = cards.find((candidate) => candidate.id === entry.cardId);
			const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
			return (
				Boolean(card) &&
				(!normalizedQuery || card!.title.toLocaleLowerCase('fr-FR').includes(normalizedQuery)) &&
				(!selectedRarities.length || selectedRarities.includes(card!.rarity)) &&
				matchesCardVariant(card!, variant) &&
				(!priority || entry.priority === priority) &&
				(!hasAlert || alerts.some((alert) => alert.cardId === entry.cardId))
			);
		})
	);
	const totalPages = $derived(Math.max(1, Math.ceil(visibleEntries.length / pageSize)));
	const filterKey = $derived(
		JSON.stringify([query, selectedRarities, priority, hasAlert, variant])
	);
	let previousFilterKey = $state('');
	const pagedEntries = $derived(
		visibleEntries
			.slice((page - 1) * pageSize, page * pageSize)
			.flatMap((entry): WishlistCard[] => {
				const card = cards.find((candidate) => candidate.id === entry.cardId);
				return card
					? [{ ...entry, card, alerts: alerts.filter((alert) => alert.cardId === entry.cardId) }]
					: [];
			})
	);

	$effect(() => {
		if (filterKey !== previousFilterKey) {
			previousFilterKey = filterKey;
			page = 1;
		}
	});

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		try {
			const [wishlist, wishlistAlerts] = await Promise.all([
				getWishlist(userId, { page: 1, pageSize: 100 }),
				getWishlistAlerts(userId)
			]);
			const wishlistCards = await Promise.all(
				wishlist.items.map((entry) => getCard(entry.cardId).catch(() => null))
			);
			cards = wishlistCards.filter((card): card is CardRecord => card !== null);
			entries = wishlist.items;
			alerts = wishlistAlerts;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});

	async function addCard(card: CardRecord) {
		const created = await addWishlistEntry(userId, card.id);
		if (!cards.some((entry) => entry.id === card.id)) cards = [...cards, card];
		entries = [...entries.filter((entry) => entry.cardId !== card.id), created];
		pickerOpen = false;
	}

	function edit(entry: WishlistEntry) {
		editingEntry = entry;
		editorOpen = true;
	}

	async function save(input: { priority: WishlistPriority; note: string | null }) {
		if (!editingEntry) return;
		const updated = await updateWishlistEntry(userId, editingEntry.cardId, input);
		entries = entries.map((entry) => (entry.cardId === updated.cardId ? updated : entry));
	}

	async function openCard(card: CardRecord) {
		selectedCard = card;
		if (wishlistsLoaded) return;
		wishlistsLoaded = true;
		try {
			wishlists = await getWishlists(userId);
		} catch {
			wishlistsLoaded = false;
		}
	}

	async function remove(cardId: string) {
		await removeWishlistEntry(userId, cardId);
		entries = entries.filter((entry) => entry.cardId !== cardId);
		cards = cards.filter((card) => card.id !== cardId);
		alerts = alerts.filter((alert) => alert.cardId !== cardId);
		if (selectedCard?.id === cardId) selectedCard = null;
	}

	async function toggleNamedWishlist(wishlistId: string, cardId: string, selected: boolean) {
		if (selected) await addWishlistRegistryCard(wishlistId, userId, cardId);
		else await removeWishlistRegistryCard(wishlistId, userId, cardId);
		wishlists = wishlists.map((wishlist) =>
			wishlist.id === wishlistId
				? {
						...wishlist,
						cardIds: selected
							? [...new Set([...wishlist.cardIds, cardId])]
							: wishlist.cardIds.filter((id) => id !== cardId)
					}
				: wishlist
		);
	}
</script>

<section class="flex flex-col gap-6 pb-12 sm:gap-8">
	<PageHeader
		eyebrow={$_('wishlist.eyebrow')}
		title={$_('wishlist.title')}
		description={$_('wishlist.description')}
	>
		{#snippet actions()}<Button onclick={() => (pickerOpen = true)}
				>{$_('wishlist.add_card')}</Button
			>{/snippet}
	</PageHeader>
	<div class="forge-panel-flat p-3">
		<p class="forge-label">
			{$_('wishlist.total', { values: { count: entries.length } })} · {$_('wishlist.alert_count', {
				values: { count: alerts.length }
			})}
		</p>
	</div>

	<WishlistControls bind:query bind:selectedRarities bind:priority bind:hasAlert bind:variant />
	{#if loading}
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('wishlist.loading')}
		</p>
	{:else if failed}
		<p class="text-destructive">{$_('codex.error')}</p>
	{:else}
		<WishlistRegistry
			entries={pagedEntries}
			{page}
			{totalPages}
			onEdit={edit}
			onRemove={remove}
			onOpen={(card) => void openCard(card)}
			onPageChange={(nextPage) => (page = nextPage)}
		/>
	{/if}
</section>

<WishlistPicker
	bind:open={pickerOpen}
	existingCardIds={entries.map((entry) => entry.cardId)}
	loadCards={getCards}
	onSelect={addCard}
/>
<WishlistEditor bind:open={editorOpen} entry={editingEntry} onSave={save} />
{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		{wishlists}
		onToggleWishlist={(wishlistId, selected) =>
			void toggleNamedWishlist(wishlistId, selectedCard!.id, selected)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
