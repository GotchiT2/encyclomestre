<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import CoinsIcon from '@lucide/svelte/icons/coins';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { auctionEscrowed } from '$lib/auctions/store';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
</script>

{#if $currentSession}
	<DropdownMenu.Root
		><DropdownMenu.Trigger
			class="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 border border-border px-2 text-sm font-semibold text-primary tabular-nums"
			aria-label={$_('navigation.money_balance', {
				values: { amount: $currentSession.user.money ?? '—' }
			})}
		>
			<CoinsIcon class="size-4" aria-hidden="true" />
			{typeof $currentSession.user.money === 'number'
				? new Intl.NumberFormat('fr', { notation: 'compact', maximumFractionDigits: 1 }).format(
						$currentSession.user.money
					)
				: '—'}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="max-w-72">
			<DropdownMenu.Label
				>{$_('navigation.money_balance', {
					values: { amount: $currentSession.user.money ?? '—' }
				})}</DropdownMenu.Label
			>
			{#if $auctionEscrowed > 0}<DropdownMenu.Item
					onSelect={() => void goto(resolve('/market?tab=bids'))}
					class="min-h-11"
					>{$_('market.auction_escrowed', {
						values: { amount: $auctionEscrowed }
					})}</DropdownMenu.Item
				>{/if}
		</DropdownMenu.Content></DropdownMenu.Root
	>
{/if}
