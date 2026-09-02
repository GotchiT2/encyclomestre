<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import CardTile from '$lib/components/card-tile.svelte';
	import ContextualCardRail from '$lib/components/cards/contextual-card-rail.svelte';
	import CollectionVitrine from './collection-vitrine.svelte';
	import CardGrid from '$lib/components/collection/card-grid.svelte';
	import FilterControls from '$lib/components/collection/filter-controls.svelte';
	import FilterShell from '$lib/components/layout/filter-shell.svelte';
	import PlayerRelationshipControl from '$lib/components/friends/player-relationship-control.svelte';
	import { Button } from '$lib/components/ui/button';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import {
		buyInstantSale,
		createFriendRequest,
		getFriendCollectionPage,
		getFriendTags,
		getFriends,
		getCurrentUserMoney,
		getUserBlocks,
		getUserInstantSales,
		wikiForgeApiErrorCode
	} from '$lib/api';
	import { currentSession, persistSession } from '$lib/auth/session';
	import { getPlayerRelationship } from '$lib/domain/friends/relationship';
	import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CardRecord, CollectionBooleanFilter, CollectionSort, CollectionTag, PlayerRelationshipStatus, SalesResult, UserProfile } from '$lib/types';
	import LockKeyholeIcon from '@lucide/svelte/icons/lock-keyhole';
	import { toast } from 'svelte-sonner';

	let { profile, initialSales }: { profile: UserProfile; initialSales: SalesResult } = $props();
	let relationship = $state<PlayerRelationshipStatus | null>(null);
	let inviting = $state(false);
	let buyingId = $state<string | null>(null);
	let sales = $state(untrack(() => initialSales));
	let friendCards = $state<CardRecord[]>([]);
	let collectionLoading = $state(false);
	let friendTags = $state<CollectionTag[]>([]);
	let friendQuery = $state('');
	let friendSort = $state<CollectionSort>('acquiredDate');
	let friendRarities = $state<CardRarity[]>([]);
	let friendTagIds = $state<string[]>([]);
	let friendDuplicate = $state<CollectionBooleanFilter>('all');
	let friendProtection = $state<CollectionBooleanFilter>('all');
	let friendPage = $state(0);
	let friendCursor = $state<string | null>(null);
	let friendHasNext = $state(false);
	let friendFilterTimer: number | undefined;
	let friendFilterKey = $state('');
	let activeTab = $state<'showcase' | 'sales' | 'collection'>('showcase');

	onMount(() => void loadRelationship());

	async function loadRelationship() {
		try {
			const [friends, blocks] = await Promise.all([getFriends(), getUserBlocks()]);
			relationship = getPlayerRelationship(profile.id, friends, blocks).status;
			if (relationship === 'friend') {
				const [tags] = await Promise.all([getFriendTags(profile.id).catch(() => []), loadCollection()]);
				friendTags = tags;
				friendFilterKey = JSON.stringify([
					friendQuery,
					friendSort,
					friendRarities,
					friendTagIds,
					friendDuplicate,
					friendProtection
				]);
			}
		} catch {
			relationship = 'none';
		}
	}

	function friendCollectionQuery(position?: { page: number; cursor: string | null }) {
		return {
			query: friendQuery,
			sortBy: friendSort,
			rarities: friendRarities.map((rarity) => cardRarityCodeByName[rarity]),
			tagIds: friendTagIds,
			duplicate: friendDuplicate,
			protected: friendProtection,
			...(position?.cursor ? { cursor: position.cursor } : { page: position?.page })
		};
	}
	async function loadCollection(append = false) {
		if (collectionLoading) return;
		collectionLoading = true;
		try {
			const page = await getFriendCollectionPage(
				profile.id,
				friendCollectionQuery(append ? { page: friendPage + 1, cursor: friendCursor } : undefined)
			);
			friendCards = append
				? [...new Map([...friendCards, ...page.items].map((card) => [card.id, card])).values()]
				: page.items;
			friendPage = page.page;
			friendCursor = page.nextCursor;
			friendHasNext = page.hasNext;
		} catch {
			friendCards = [];
		} finally {
			collectionLoading = false;
		}
	}

	$effect(() => {
		if (relationship !== 'friend') return;
		const key = JSON.stringify([friendQuery, friendSort, friendRarities, friendTagIds, friendDuplicate, friendProtection]);
		if (key === friendFilterKey) return;
		window.clearTimeout(friendFilterTimer);
		friendFilterTimer = window.setTimeout(() => {
			friendFilterKey = key;
			void loadCollection();
		}, 450);
		return () => window.clearTimeout(friendFilterTimer);
	});

	async function invite() {
		if (inviting) return;
		inviting = true;
		try {
			await createFriendRequest('', profile.id);
			relationship = 'pending';
		} finally {
			inviting = false;
		}
	}

	async function buy(saleId: string) {
		if (buyingId) return;
		buyingId = saleId;
		try {
			await buyInstantSale(saleId);
			sales = await getUserInstantSales(profile.id);
			const money = await getCurrentUserMoney().catch(() => undefined);
			const session = $currentSession;
			if (session && typeof money === 'number') {
				persistSession(localStorage, { ...session, user: { ...session.user, money } });
			}
			await invalidateAll();
			toast.success($_('profile.sale_bought'));
		} catch (error) {
			toast.error(
				wikiForgeApiErrorCode(error) === 'NOT_ENOUGH_MONEY'
					? $_('profile.not_enough_money')
					: $_('profile.sale_conflict')
			);
		} finally {
			buyingId = null;
		}
	}
</script>

<section class="flex flex-col gap-6 pb-12">
	<header class="forge-panel flex flex-col gap-5 overflow-hidden p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
		<UserAvatar
			image={profile.image}
			name={profile.name}
			lastConnection={profile.lastConnection}
			presenceSize="lg"
			size="lg"
			class="size-24 text-3xl sm:size-28"
		/>
		<div class="min-w-0 flex-1">
			<p class="forge-label text-primary">{$_('friends.profile')}</p>
			<h1 class="mt-1 truncate font-serif text-3xl font-bold sm:text-4xl">{profile.name}</h1>
			<div class="mt-4 grid grid-cols-2 gap-2 sm:max-w-md">
				<div class="border border-primary/25 bg-background/40 px-3 py-2">
					<p class="forge-label">{$_('profile.cards_owned')}</p>
					<p class="mt-1 font-heading text-xl tracking-wider">{profile.nbCards}</p>
				</div>
				<div class="border border-primary/25 bg-background/40 px-3 py-2">
					<p class="forge-label">{$_('profile.member_since')}</p>
					<p class="mt-1 text-sm font-bold">{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(`${profile.joinedAt}-01T00:00:00Z`))}</p>
				</div>
			</div>
			{#if profile.full && profile.tags.length}<div class="mt-4">
				<p class="forge-label">{$_('profile.tags_title')}</p>
				<ul class="mt-2 flex flex-wrap gap-1.5">
					{#each profile.tags as tag (`${tag.name}-${tag.color}`)}<li class="border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase" style={`color:${tag.color};border-color:${tag.color}`}>{tag.name}</li>{/each}
				</ul>
			</div>{/if}
		</div>
		<PlayerRelationshipControl status={relationship} busy={inviting} onInvite={invite} />
	</header>

	<div
		class="grid border border-primary/30 bg-card p-1 {relationship === 'friend' ? 'grid-cols-3' : 'grid-cols-2'}"
		role="tablist"
		aria-label={$_('profile.tabs_aria')}
	>
		<Button variant={activeTab === 'showcase' ? 'default' : 'ghost'} role="tab" aria-selected={activeTab === 'showcase'} onclick={() => (activeTab = 'showcase')}>{$_('profile.tab_showcase')}</Button>
		<Button variant={activeTab === 'sales' ? 'default' : 'ghost'} role="tab" aria-selected={activeTab === 'sales'} onclick={() => (activeTab = 'sales')}>{$_('profile.tab_sales')}</Button>
		{#if relationship === 'friend'}<Button variant={activeTab === 'collection' ? 'default' : 'ghost'} role="tab" aria-selected={activeTab === 'collection'} onclick={() => (activeTab = 'collection')}>{$_('friends.collection_tab')}</Button>{/if}
	</div>

	{#if !profile.full && activeTab === 'showcase'}
		<div class="forge-panel-flat flex gap-3 p-4 text-muted-foreground">
			<LockKeyholeIcon class="size-5 shrink-0 text-primary" />
			<div>
				<p class="font-bold text-foreground">{$_('profile.restricted_title')}</p>
				<p class="text-sm">{$_('profile.restricted_description')}</p>
			</div>
		</div>
	{:else if profile.full && activeTab === 'showcase'}
		<section class="flex flex-col gap-0">
			{#each profile.showcase as line (`${line.title}-${line.cards.map((card) => card.id).join('-')}`)}
				<CollectionVitrine title={line.title} cards={line.cards} perRow={5} maxPerRow={5} />
			{:else}<p class="forge-panel-flat p-4 text-muted-foreground">
					{$_('profile.showcase_empty')}
				</p>{/each}
		</section>
	{/if}

	{#if activeTab === 'sales'}<section>
		<h2 class="font-serif text-2xl font-bold">{$_('profile.buy_now_title')}</h2>
		{#if sales.instantSales.length}<ContextualCardRail
				class="mt-4"
				items={sales.instantSales}
				label={$_('profile.buy_now_title')}
				itemKey={(sale) => sale.id}
				desktopGridClass="lg:grid-cols-4 xl:grid-cols-6"
				>{#snippet children(sale)}<article class="forge-panel-flat p-2">
						<CardTile card={sale.card} showFriendOwners={false} />
						<div class="mt-2 flex items-center justify-between gap-2">
							<strong>{sale.price} ◈</strong><Button
								size="sm"
								disabled={buyingId !== null || profile.id === $currentSession?.user.id}
								onclick={() => buy(sale.id)}>{$_('profile.buy_action')}</Button
							>
						</div>
					</article>{/snippet}</ContextualCardRail
			>{:else}<p class="mt-3 text-sm text-muted-foreground">{$_('friends.empty_sales')}</p>{/if}
	</section>{/if}

	{#if relationship === 'friend' && activeTab === 'collection'}
		<section class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
			<FilterShell description={$_('collection.filtersDescription')}>
				<FilterControls
					bind:query={friendQuery}
					bind:sortBy={friendSort}
					bind:selectedRarities={friendRarities}
					bind:tagFilterIds={friendTagIds}
					bind:duplicate={friendDuplicate}
					bind:protected={friendProtection}
					tags={friendTags}
					canonical
					allowTagCreation={false}
					onOpenTagEditor={() => {}}
					onClear={() => {
						friendQuery = '';
						friendSort = 'acquiredDate';
						friendRarities = [];
						friendTagIds = [];
						friendDuplicate = 'all';
						friendProtection = 'all';
					}}
				/>
			</FilterShell>
			<div class="min-w-0">
				{#if collectionLoading}<p class="forge-label text-primary">{$_('friends.loading')}</p>
				{:else if friendCards.length}
					<CardGrid
						cards={friendCards}
						tags={friendTags}
						assignments={Object.fromEntries(friendCards.map((card) => [card.id, card.collectionTagIds ?? []]))}
						isSelectionMode={false}
						selectedCardIds={[]}
						onToggleCard={() => {}}
					/>
					{#if friendHasNext}<div class="mt-5 flex justify-center"><Button variant="outline" onclick={() => void loadCollection(true)}>{$_('collection.load_more')}</Button></div>{/if}
				{:else}<p class="text-sm text-muted-foreground">{$_('friends.empty_collection')}</p>{/if}
			</div>
		</section>
	{/if}
</section>
