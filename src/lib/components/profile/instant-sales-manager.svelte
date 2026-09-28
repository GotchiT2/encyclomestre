<script lang="ts">
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import { activeRestrictions } from '$lib/moderation/state';
	import CardPicker from './card-picker.svelte';
	import { activeAuctionCardIds } from '$lib/auctions/store';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRecord, SalesResult } from '$lib/types';

	let {
		sales,
		collection,
		busy = false,
		hasMoreCards = false,
		loadingMoreCards = false,
		onCreate,
		onCancel,
		onLoadMoreCards
	}: {
		sales: SalesResult;
		collection: CardRecord[];
		busy?: boolean;
		hasMoreCards?: boolean;
		loadingMoreCards?: boolean;
		onCreate: (cardId: string, price: number) => void;
		onCancel: (saleId: string) => void;
		onLoadMoreCards?: () => void;
	} = $props();
	let pickerOpen = $state(false);
	let selected = $state<CardRecord | null>(null);
	let price = $state('');
	const unavailableIds = $derived(new Set(sales.instantSales.map((sale) => sale.card.id)));
	const candidates = $derived(
		collection.filter(
			(card) =>
				!card.userProtected &&
				!card.saleId &&
				!card.activeAuctionId &&
				!$activeAuctionCardIds.has(card.id) &&
				!unavailableIds.has(card.id)
		)
	);
	const validPrice = $derived(Number.isSafeInteger(Number(price)) && Number(price) > 0);
</script>

<section class="flex flex-col gap-4">
	<SanctionNotice kind="TRADE" />
	<div class="forge-panel-flat flex flex-wrap items-end gap-3 p-4">
		<div class="min-w-48 flex-1">
			<p class="forge-label">
				{$_('profile.instant_sales_capacity', { values: { count: sales.instantSales.length } })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{selected?.title ?? $_('profile.no_sale_card_selected')}
			</p>
		</div>
		<Button
			variant="outline"
			disabled={sales.instantSales.length >= 3}
			onclick={() => (pickerOpen = true)}>{$_('profile.choose_sale_card')}</Button
		>
		<Input
			class="w-32"
			type="number"
			min="1"
			step="1"
			bind:value={price}
			placeholder={$_('profile.sale_price')}
			aria-label={$_('profile.sale_price')}
		/>
		<Button
			disabled={!selected ||
				!validPrice ||
				busy ||
				sales.instantSales.length >= 3 ||
				$activeRestrictions.includes('TRADE')}
			onclick={() => selected && onCreate(selected.id, Number(price))}
			>{$_('profile.create_instant_sale')}</Button
		>
	</div>
	{#if sales.instantSales.length}
		<div class="flex snap-x gap-3 overflow-x-auto pb-2">
			{#each sales.instantSales as sale (sale.id)}<article
					class="forge-panel-flat flex w-36 shrink-0 snap-start flex-col gap-2 p-2 sm:w-40"
				>
					<CardTile card={sale.card} showFriendOwners={false} />
					<p class="forge-label text-primary">{sale.price} ◈</p>
					<Button
						class="mt-auto w-full"
						size="sm"
						variant="outline"
						disabled={busy}
						onclick={() => onCancel(sale.id)}>{$_('profile.cancel_instant_sale')}</Button
					>
				</article>{/each}
		</div>
	{:else}
		<p class="forge-panel-flat p-4 text-sm text-muted-foreground">
			{$_('profile.no_instant_sales')}
		</p>
	{/if}
</section>

<CardPicker
	bind:open={pickerOpen}
	cards={candidates}
	title={$_('profile.choose_sale_card')}
	onSelect={(card) => (selected = card)}
	hasMore={hasMoreCards}
	loadingMore={loadingMoreCards}
	onLoadMore={onLoadMoreCards}
/>
