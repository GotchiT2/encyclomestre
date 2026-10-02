<script lang="ts">
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import ShowcaseEditor from './showcase-editor.svelte';
	import CollectionVitrine from './collection-vitrine.svelte';
	import AvatarEditor from '$lib/components/settings/avatar-editor.svelte';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import InstantSalesManager from './instant-sales-manager.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		buyShowcaseSlot,
		getCurrentUserMoney,
		cancelInstantSale,
		createInstantSale,
		getWikiForgeCollectionPage,
		getMyShowcase,
		getUserInstantSales,
		replaceMyShowcase,
		wikiForgeApiErrorCode
	} from '$lib/api';
	import type { CollectionPageResult } from '$lib/api';
	import type { CollectionQuery } from '$lib/api';
	import { currentSession, persistSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { toast } from 'svelte-sonner';
	import { untrack } from 'svelte';
	import type { CollectionTag, SalesResult, Showcase, User } from '$lib/types';

	let {
		user,
		initialShowcase,
		initialCollection,
		tags,
		initialSales
	}: {
		user: User;
		initialShowcase: Showcase;
		initialCollection: CollectionPageResult;
		tags: CollectionTag[];
		initialSales: SalesResult;
	} = $props();
	let activeTab = $state<'showcase' | 'sales'>('showcase');
	let managingShowcase = $state(false);
	let showcase = $state(untrack(() => initialShowcase));
	let sales = $state(untrack(() => initialSales));
	let collection = $state(untrack(() => initialCollection.items));
	let collectionPage = $state(untrack(() => initialCollection.page));
	let collectionCursor = $state(untrack(() => initialCollection.nextCursor));
	let collectionHasNext = $state(untrack(() => initialCollection.hasNext));
	let collectionLoading = $state(false);
	let sequence = 0;
	let collectionTotal = $state(untrack(() => initialCollection.total));
	let pickerQuery = $state<CollectionQuery>({});
	let money = $state(untrack(() => user.money ?? 0));
	let saving = $state(false);
	let buyingSlot = $state(false);
	let buySlotOpen = $state(false);
	let salesBusy = $state(false);
	let avatarPickerOpen = $state(false);
	let avatarUrl = $state(untrack(() => user.avatarUrl));
	let handledRealtimeRevision = 0;
	const ownedCards = $derived(
		collectionTotal >= 0
			? String(collectionTotal)
			: `${initialCollection.items.length}${initialCollection.hasNext ? '+' : ''}`
	);

	function errorMessage(error: unknown, domain: 'showcase' | 'sale') {
		const code = wikiForgeApiErrorCode(error);
		if (code === 'NOT_ENOUGH_MONEY') return $_('profile.not_enough_money');
		if (code === 'SHOWCASE_CONFLICT') return $_('profile.showcase_conflict');
		if (code === 'SALE_CONFLICT') return $_('profile.sale_conflict');
		return $_(domain === 'showcase' ? 'profile.showcase_error' : 'profile.sale_error');
	}

	async function saveShowcase(lines: Array<{ title: string; cardIds: string[] }>) {
		saving = true;
		try {
			showcase = await replaceMyShowcase(lines);
			toast.success($_('profile.showcase_saved'));
		} catch (error) {
			toast.error(errorMessage(error, 'showcase'));
			throw error;
		} finally {
			saving = false;
		}
	}
	async function buySlot() {
		if (buyingSlot) return;
		buyingSlot = true;
		try {
			showcase = await buyShowcaseSlot();
			buySlotOpen = false;
			money = await getCurrentUserMoney();
			const session = $currentSession;
			if (session) persistSession(localStorage, { ...session, user: { ...session.user, money } });
			toast.success($_('profile.showcase_slot_bought'));
		} catch (error) {
			toast.error(errorMessage(error, 'showcase'));
		} finally {
			buyingSlot = false;
		}
	}
	async function createSale(cardId: string, price: number) {
		if (salesBusy) return;
		salesBusy = true;
		try {
			sales = await createInstantSale(cardId, price);
			toast.success($_('profile.sale_created'));
		} catch (error) {
			toast.error(errorMessage(error, 'sale'));
		} finally {
			salesBusy = false;
		}
	}
	async function cancelSale(saleId: string) {
		if (salesBusy) return;
		salesBusy = true;
		try {
			sales = await cancelInstantSale(saleId);
			toast.success($_('profile.sale_cancelled'));
		} catch (error) {
			toast.error(errorMessage(error, 'sale'));
		} finally {
			salesBusy = false;
		}
	}

	async function refreshRealtimeProfile() {
		if (saving || buyingSlot || salesBusy || collectionLoading) return;
		const [nextShowcase, nextSales, nextCollection] = await Promise.all([
			getMyShowcase(),
			getUserInstantSales(user.id),
			getWikiForgeCollectionPage(pickerQuery)
		]);
		showcase = nextShowcase;
		sales = nextSales;
		collection = nextCollection.items;
		collectionTotal = nextCollection.total;
		collectionPage = nextCollection.page;
		collectionCursor = nextCollection.nextCursor;
		collectionHasNext = nextCollection.hasNext;
	}

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			saving ||
			buyingSlot ||
			salesBusy ||
			collectionLoading ||
			refresh.revision === handledRealtimeRevision ||
			(!refreshIncludes(refresh, 'profile') && !refreshIncludes(refresh, 'collection'))
		)
			return;
		handledRealtimeRevision = refresh.revision;
		void refreshRealtimeProfile().catch(() => undefined);
	});
	async function loadMoreCollection() {
		if (!collectionHasNext || collectionLoading) return;
		const request = sequence;
		collectionLoading = true;
		try {
			const next = await getWikiForgeCollectionPage({
				...pickerQuery,
				...(collectionCursor ? { cursor: collectionCursor } : { page: collectionPage + 1 })
			});
			if (request !== sequence) return;
			const known = new Set(collection.map((card) => card.id));
			collection = [...collection, ...next.items.filter((card) => !known.has(card.id))];
			collectionPage = next.page;
			collectionCursor = next.nextCursor;
			collectionHasNext = next.hasNext;
		} catch {
			toast.error($_('collection.load_more_error'));
		} finally {
			if (request === sequence) collectionLoading = false;
		}
	}
	async function refreshPickerCollection(filters: CollectionQuery) {
		const request = ++sequence;
		pickerQuery = filters;
		collectionLoading = true;
		try {
			const next = await getWikiForgeCollectionPage(filters);
			if (request !== sequence) return;
			collection = next.items;
			collectionPage = next.page;
			collectionCursor = next.nextCursor;
			collectionHasNext = next.hasNext;
		} catch {
			toast.error($_('collection.load_error'));
		} finally {
			if (request === sequence) collectionLoading = false;
		}
	}
</script>

<section class="flex flex-col gap-6 pb-12 sm:gap-8">
	<PageHeader
		eyebrow={$_('profile.title')}
		title={user.username}
		description={$_('profile.connected_description')}
	/>
	<header
		class="forge-panel flex flex-col gap-5 overflow-hidden p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
	>
		<button
			type="button"
			class="group relative size-24 shrink-0 overflow-hidden rounded-full border border-primary/40 shadow-[0_12px_24px_rgb(0_0_0_/_35%)] sm:size-28"
			aria-label={$_('settings.choose_avatar')}
			onclick={() => (avatarPickerOpen = true)}
		>
			<UserAvatar
				image={avatarUrl}
				name={user.username}
				crop={$currentSession?.user.imageCrop}
				size="lg"
				class="size-full"
			/>
			<span
				class="absolute inset-x-0 bottom-0 bg-background/80 py-1 text-[9px] font-bold tracking-wider text-primary uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
				>{$_('settings.choose_avatar')}</span
			>
		</button>
		<div class="min-w-0 flex-1">
			<p class="forge-label text-primary">{$_('profile.title')}</p>
			<h2 class="mt-1 truncate font-serif text-3xl font-bold sm:text-4xl">{user.username}</h2>
			<div class="mt-4 grid grid-cols-2 gap-2 sm:max-w-md">
				<div class="border border-primary/25 bg-background/40 px-3 py-2">
					<p class="forge-label">{$_('profile.cards_owned')}</p>
					<p class="mt-1 font-heading text-xl tracking-wider">{ownedCards}</p>
				</div>
				<div class="border border-primary/25 bg-background/40 px-3 py-2">
					<p class="forge-label">{$_('profile.member_since')}</p>
					<p class="mt-1 text-sm font-bold">
						{user.createdAt && Number.isFinite(Date.parse(user.createdAt))
							? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
									new Date(user.createdAt)
								)
							: $_('plan.unknownDate')}
					</p>
				</div>
			</div>
			{#if tags.length}
				<div class="mt-4">
					<p class="forge-label">{$_('profile.tags_title')}</p>
					<ul class="mt-2 flex flex-wrap gap-1.5">
						{#each tags as tag (tag.id)}
							<li
								class="border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase"
								style={`color:${tag.color};border-color:${tag.color}`}
							>
								{tag.name}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</header>
	<div
		class="grid grid-cols-2 border border-primary/30 bg-card p-1"
		role="tablist"
		aria-label={$_('profile.tabs_aria')}
	>
		<Button
			variant={activeTab === 'showcase' ? 'default' : 'ghost'}
			role="tab"
			aria-selected={activeTab === 'showcase'}
			onclick={() => (activeTab = 'showcase')}>{$_('profile.tab_showcase')}</Button
		>
		<Button
			variant={activeTab === 'sales' ? 'default' : 'ghost'}
			role="tab"
			aria-selected={activeTab === 'sales'}
			onclick={() => (activeTab = 'sales')}>{$_('profile.tab_sales')}</Button
		>
	</div>
	{#if activeTab === 'showcase'}
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-2xl">{$_('profile.tab_showcase')}</h2>
			<Button
				variant={managingShowcase ? 'default' : 'outline'}
				onclick={() => (managingShowcase = !managingShowcase)}
				>{$_(managingShowcase ? 'arcade.finishManaging' : 'arcade.manageShowcase')}</Button
			>
		</div>
		{#if !managingShowcase}
			{#each showcase.lines as line, index (index)}<CollectionVitrine
					title={line.title}
					cards={line.cards}
					owned
				/>{/each}
			{#if !showcase.lines.length}<p
					class="border border-dashed border-border p-8 text-center text-muted-foreground"
				>
					{$_('arcade.emptyShowcase')}
				</p>{/if}
		{:else}<ShowcaseEditor
				{showcase}
				{collection}
				{tags}
				{money}
				{saving}
				buying={buyingSlot}
				onSave={saveShowcase}
				onBuySlot={() => (buySlotOpen = true)}
				hasMoreCards={collectionHasNext}
				loadingMoreCards={collectionLoading}
				onLoadMoreCards={loadMoreCollection}
				onFiltersChange={refreshPickerCollection}
			/>{/if}{:else}<InstantSalesManager
			{sales}
			{collection}
			busy={salesBusy}
			onCreate={createSale}
			onCancel={cancelSale}
			hasMoreCards={collectionHasNext}
			loadingMoreCards={collectionLoading}
			onLoadMoreCards={loadMoreCollection}
		/>{/if}
</section>

<AvatarEditor bind:open={avatarPickerOpen} onSaved={(next) => (avatarUrl = next.avatarUrl)} />
<Dialog.Root bind:open={buySlotOpen}
	><Dialog.Content class="p-5"
		><Dialog.Title
			>{$_('profile.buy_showcase_slot', { values: { price: showcase.slotPrice } })}</Dialog.Title
		><Dialog.Description
			>{$_('profile.buy_showcase_slot_confirm', {
				values: { price: showcase.slotPrice }
			})}</Dialog.Description
		>
		<div class="flex gap-3">
			<Button variant="outline" disabled={buyingSlot} onclick={() => (buySlotOpen = false)}
				>{$_('completion.cancel')}</Button
			><Button disabled={buyingSlot} onclick={buySlot}>{$_('completion.confirm')}</Button>
		</div></Dialog.Content
	></Dialog.Root
>
