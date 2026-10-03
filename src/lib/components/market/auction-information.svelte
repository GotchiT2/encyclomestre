<script lang="ts">
	import { Info } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { Auction } from '$lib/types';
	let { auction }: { auction: Auction } = $props();
	let open = $state(false);
	const date = (value: string) =>
		Number.isFinite(Date.parse(value))
			? new Intl.DateTimeFormat('fr', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(value)
				)
			: '—';
</script>

<Button variant="ghost" onclick={() => (open = true)}
	><Info data-icon="inline-start" />{$_('auctionHub.information')}</Button
>
<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg overflow-y-auto p-4 sm:p-5">
		<Dialog.Title>{$_('auctionHub.informationTitle')}</Dialog.Title>
		<Dialog.Description class="whitespace-pre-line"
			>{$_('market.auction_max_help')}</Dialog.Description
		>
		<p class="text-sm">{$_('market.auction_proxy_help')}</p>
		<p class="text-sm">{$_('market.auction_tie_help')}</p>
		<dl class="grid gap-3 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted-foreground">{$_('auctionHub.starts')}</dt>
				<dd>{date(auction.startsAt)}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">{$_('auctionHub.ends')}</dt>
				<dd>{date(auction.endsAt)}</dd>
			</div>
			{#if auction.closedAt}<div>
					<dt>{$_('auctionHub.closed')}</dt>
					<dd>{date(auction.closedAt)}</dd>
				</div>{/if}
			{#if auction.listingFee !== undefined}<div>
					<dt>{$_('apiEvolution.listingFee')}</dt>
					<dd>{auction.listingFee} ◈</dd>
				</div>{/if}
			{#if auction.finalFee !== undefined}<div>
					<dt>{$_('apiEvolution.finalFee')}</dt>
					<dd>{auction.finalFee} ◈</dd>
				</div>{/if}
		</dl>
		<p class="text-sm text-muted-foreground">
			{$_('auctionHub.extensions', { values: { count: auction.nbExtensions } })}
		</p>
	</Dialog.Content>
</Dialog.Root>
