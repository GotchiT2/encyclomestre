<script lang="ts">
	import { currentSession } from '$lib/auth/session';
	import { _ } from '$lib/i18n';
	import CoinsIcon from '@lucide/svelte/icons/coins';
	import { resolve } from '$app/paths';
	import { auctionEscrowed } from '$lib/auctions/store';
</script>

{#if $currentSession}
	<span
		class="inline-flex min-h-9 items-center gap-1.5 border border-primary/35 bg-background/85 px-2.5 font-sans text-sm font-bold text-primary shadow-[0_8px_22px_rgb(0_0_0_/_22%)]"
		aria-label={$_('navigation.money_balance', {
			values: { amount: $currentSession.user.money ?? '—' }
		})}
		aria-live="polite"
	>
		<CoinsIcon class="size-4" aria-hidden="true" />
		{$currentSession.user.money ?? '—'}{#if $auctionEscrowed > 0}<a
				href={resolve('/market?tab=bids')}
				class="ml-1 border-l border-primary/30 pl-2 text-[10px] font-medium text-muted-foreground underline"
				title={$_('market.auction_escrowed', { values: { amount: $auctionEscrowed } })}
				>{$_('market.auction_escrow_short', { values: { amount: $auctionEscrowed } })}</a
			>{/if}
	</span>
{/if}
