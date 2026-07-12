<script lang="ts">
	import { onMount } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import {
		addWishlistEntry,
		getCards,
		getWishlist,
		getWishlistAlerts,
		removeWishlistEntry,
		updateWishlistEntry
	} from '$lib/api';
	import WishlistControls from '$lib/components/wishlist/wishlist-controls.svelte';
	import WishlistEditor from '$lib/components/wishlist/wishlist-editor.svelte';
	import WishlistPicker from '$lib/components/wishlist/wishlist-picker.svelte';
	import WishlistRegistry, {
		type WishlistCard
	} from '$lib/components/wishlist/wishlist-registry.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type {
		CardRarity,
		CardRecord,
		WishlistAlert,
		WishlistEntry,
		WishlistPriority
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
	let page = $state(1);
	let pickerOpen = $state(false);
	let editorOpen = $state(false);
	let editingEntry = $state<WishlistEntry | null>(null);
	let loading = $state(true);

	const visibleEntries = $derived(
		entries.filter((entry) => {
			const card = cards.find((candidate) => candidate.id === entry.cardId);
			const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
			return (
				Boolean(card) &&
				(!normalizedQuery || card!.title.toLocaleLowerCase('fr-FR').includes(normalizedQuery)) &&
				(!selectedRarities.length || selectedRarities.includes(card!.rarity)) &&
				(!priority || entry.priority === priority) &&
				(!hasAlert || alerts.some((alert) => alert.cardId === entry.cardId))
			);
		})
	);
	const totalPages = $derived(Math.max(1, Math.ceil(visibleEntries.length / pageSize)));
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
		query;
		selectedRarities;
		priority;
		hasAlert;
		page = 1;
	});

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		const [catalogue, wishlist, wishlistAlerts] = await Promise.all([
			getCards({ page: 1, pageSize: 100 }),
			getWishlist(userId, { page: 1, pageSize: 100 }),
			getWishlistAlerts(userId)
		]);
		cards = catalogue.items;
		entries = wishlist.items;
		alerts = wishlistAlerts;
		loading = false;
	});

	async function refresh() {
		const [wishlist, wishlistAlerts] = await Promise.all([
			getWishlist(userId, { page: 1, pageSize: 100 }),
			getWishlistAlerts(userId)
		]);
		entries = wishlist.items;
		alerts = wishlistAlerts;
	}

	async function addCard(cardId: string) {
		await addWishlistEntry(userId, cardId);
		await refresh();
	}

	function edit(entry: WishlistEntry) {
		editingEntry = entry;
		editorOpen = true;
	}

	async function save(input: { priority: WishlistPriority; note: string | null }) {
		if (!editingEntry) return;
		await updateWishlistEntry(userId, editingEntry.cardId, input);
		await refresh();
	}

	async function remove(cardId: string) {
		await removeWishlistEntry(userId, cardId);
		await refresh();
	}
</script>

<section class="flex flex-col gap-6 pb-12 sm:gap-8">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
			{$_('wishlist.eyebrow')}
		</p>
		<div class="mt-3 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1
					class="font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl"
				>
					{$_('wishlist.title')}
				</h1>
				<p class="mt-3 max-w-2xl font-serif italic leading-relaxed text-muted-foreground">
					{$_('wishlist.description')}
				</p>
			</div>
			<Button onclick={() => (pickerOpen = true)}>{$_('wishlist.add_card')}</Button>
		</div>
		<p class="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('wishlist.total', { values: { count: entries.length } })} · {$_('wishlist.alert_count', {
				values: { count: alerts.length }
			})}
		</p>
	</header>

	<WishlistControls bind:query bind:selectedRarities bind:priority bind:hasAlert />
	{#if loading}
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('wishlist.loading')}
		</p>
	{:else}
		<WishlistRegistry
			entries={pagedEntries}
			{page}
			{totalPages}
			onEdit={edit}
			onRemove={remove}
			onPageChange={(nextPage) => (page = nextPage)}
		/>
	{/if}
</section>

<WishlistPicker
	bind:open={pickerOpen}
	{cards}
	existingCardIds={entries.map((entry) => entry.cardId)}
	onSelect={addCard}
/>
<WishlistEditor bind:open={editorOpen} entry={editingEntry} onSave={save} />
