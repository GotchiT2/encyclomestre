<script lang="ts">
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import ShowcaseEditor from './showcase-editor.svelte';
	import ArticlePicker from '$lib/components/selectors/article-picker.svelte';
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
		wikiForgeApiErrorCode,
		updateWikiForgeImage
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
	let showcase = $state(untrack(() => initialShowcase));
	let sales = $state(untrack(() => initialSales));
	let collection = $state(untrack(() => initialCollection.items));
	let collectionPage = $state(untrack(() => initialCollection.page));
	let collectionCursor = $state(untrack(() => initialCollection.nextCursor));
	let collectionHasNext = $state(untrack(() => initialCollection.hasNext));
	let collectionLoading = $state(false);
	let pickerQuery = $state<CollectionQuery>({});
	let money = $state(untrack(() => user.money ?? 0));
	let saving = $state(false);
	let buyingSlot = $state(false);
	let buySlotOpen = $state(false);
	let avatarPageId = $state<number | undefined>(untrack(() => user.imagePageId ?? undefined));
	let salesBusy = $state(false);
	let avatarPickerOpen = $state(false);
	let avatarBusy = $state(false);
	let avatarUrl = $state(untrack(() => user.avatarUrl));
	let handledRealtimeRevision = 0;
	const ownedCards = $derived(
		initialCollection.total >= 0
			? String(initialCollection.total)
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
		collectionPage = nextCollection.page;
		collectionCursor = nextCollection.nextCursor;
		collectionHasNext = nextCollection.hasNext;
	}

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			refresh.revision === handledRealtimeRevision ||
			(!refreshIncludes(refresh, 'profile') && !refreshIncludes(refresh, 'collection'))
		)
			return;
		handledRealtimeRevision = refresh.revision;
		void refreshRealtimeProfile().catch(() => undefined);
	});
	async function loadMoreCollection() {
		if (!collectionHasNext || collectionLoading) return;
		collectionLoading = true;
		try {
			const next = await getWikiForgeCollectionPage({
				...pickerQuery,
				...(collectionCursor ? { cursor: collectionCursor } : { page: collectionPage + 1 })
			});
			const known = new Set(collection.map((card) => card.id));
			collection = [...collection, ...next.items.filter((card) => !known.has(card.id))];
			collectionPage = next.page;
			collectionCursor = next.nextCursor;
			collectionHasNext = next.hasNext;
		} catch {
			toast.error($_('collection.load_more_error'));
		} finally {
			collectionLoading = false;
		}
	}
	async function refreshPickerCollection(filters: CollectionQuery) {
		if (collectionLoading) return;
		pickerQuery = filters;
		collectionLoading = true;
		try {
			const next = await getWikiForgeCollectionPage(filters);
			collection = next.items;
			collectionPage = next.page;
			collectionCursor = next.nextCursor;
			collectionHasNext = next.hasNext;
		} catch {
			toast.error($_('collection.load_error'));
		} finally {
			collectionLoading = false;
		}
	}
	async function updateAvatar() {
		if (avatarBusy) return;
		avatarBusy = true;
		try {
			const next = await updateWikiForgeImage(avatarPageId ?? null);
			avatarUrl = next.avatarUrl;
			const session = $currentSession;
			if (session)
				persistSession(localStorage, { ...session, user: { ...session.user, avatarUrl } });
			avatarPickerOpen = false;
			toast.success($_('profile.avatar_updated'));
		} catch {
			toast.error($_('profile.avatar_error'));
		} finally {
			avatarBusy = false;
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
			{#if avatarUrl}<img src={avatarUrl} alt="" class="size-full object-cover" />{:else}<span
					class="grid size-full place-items-center bg-background text-3xl font-serif font-bold text-primary"
					aria-hidden="true"
				>
					{user.username.slice(0, 1).toUpperCase()}
				</span>{/if}
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
						{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
							new Date(user.createdAt)
						)}
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
	{#if activeTab === 'showcase'}<ShowcaseEditor
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
		/>{:else}<InstantSalesManager
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

<Dialog.Root bind:open={avatarPickerOpen}
	><Dialog.Content class="p-5"
		><Dialog.Title>{$_('settings.choose_avatar')}</Dialog.Title><ArticlePicker
			bind:value={avatarPageId}
		/><Button disabled={avatarBusy} onclick={updateAvatar}>{$_('completion.save')}</Button
		></Dialog.Content
	></Dialog.Root
>
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
