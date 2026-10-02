<script lang="ts">
	import ActivityShortcuts from './activity-shortcuts.svelte';
	import { resolve } from '$app/paths';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import HandshakeIcon from '@lucide/svelte/icons/handshake';
	import PackageOpenIcon from '@lucide/svelte/icons/package-open';

	import type { DashboardData } from '$lib/types';

	let { username, dashboard }: { username: string; dashboard: DashboardData | null } = $props();
	const recentCards = $derived(dashboard?.recentAcquisitions ?? []);
	const rank = $derived(
		dashboard?.rank ? `${dashboard.rank}${dashboard.rank === 1 ? 'er' : 'e'}` : '—'
	);
</script>

<section class="recap-workbench">
	<header class="recap-header">
		<div>
			<p class="forge-label">{$_('dashboard.eyebrow')}</p>
			<h1 class="text-4xl lg:text-5xl">{$_('dashboard.welcome', { values: { username } })}</h1>
		</div>
		<Button href={resolve('/collection')} variant="outline"
			>{$_('dashboard.viewCollection')}<ArrowUpRightIcon /></Button
		>
	</header>
	<div class="recap-layout">
		<section class="recap-actions">
			<h2 class="text-2xl">{$_('arcade.nextSteps')}</h2>
			<ActivityShortcuts {dashboard} />
			{#if (dashboard?.pendingTrades ?? 0) > 0}<a class="action-ticket" href={resolve('/trades')}
					><HandshakeIcon />
					<span>{$_('dashboard.tradeTitle', { values: { count: dashboard?.pendingTrades } })}</span
					><ArrowUpRightIcon /></a
				>{/if}
			{#if (dashboard?.pendingAuction ?? 0) > 0}<a class="action-ticket" href={resolve('/market')}>
					<span
						>{$_('dashboard.auctionTitle', { values: { count: dashboard?.pendingAuction } })}</span
					><ArrowUpRightIcon /></a
				>{/if}
			<a class="action-ticket booster-ticket" href={resolve('/boosters')}
				><PackageOpenIcon /><span>
					{$_(
						dashboard?.packs.some((pack) => pack.available > 0)
							? 'dashboard.boosterReady'
							: 'plan.boosters.checkAvailability'
					)}
				</span><ArrowUpRightIcon /></a
			>
			{#if dashboard?.guild}<a
					class="action-ticket"
					href={resolve('/guilds/[id]', { id: String(dashboard.guild.id) })}
					>{dashboard.guild.name}<ArrowUpRightIcon /></a
				>{/if}
		</section>
		<section class="recap-acquisitions">
			<h2 class="text-2xl mb-4">{$_('dashboard.recentCards')}</h2>
			<div class="recap-grid">
				{#each recentCards as card (card.id)}<CardTile
						owned
						{card}
						showFriendOwners={false}
					/>{/each}
			</div>
		</section>
	</div>
	<dl class="recap-stats">
		<div>
			<dt>{$_('dashboard.cards')}</dt>
			<dd>{dashboard ? dashboard.collection.totalCopies : '—'}</dd>
		</div>
		<div>
			<dt>{$_('dashboard.money')}</dt>
			<dd>{dashboard ? dashboard.money : '—'}</dd>
		</div>
		<div>
			<dt>{$_('dashboard.rank')}</dt>
			<dd>{rank}</dd>
		</div>
	</dl>
</section>

<style>
	.recap-workbench {
		display: grid;
		gap: 24px;
	}
	.recap-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.recap-layout {
		display: grid;
		gap: 24px;
	}
	.recap-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.action-ticket {
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding: 16px 0;
		min-height: 56px;
	}
	.action-ticket span {
		flex: 1;
	}
	.booster-ticket {
		border-left: 3px solid var(--primary);
		padding-left: 12px;
	}
	.recap-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
		gap: 12px;
	}
	.recap-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		border-top: 1px solid var(--border);
		padding-top: 16px;
	}
	.recap-stats div {
		display: flex;
		gap: 12px;
		align-items: baseline;
	}
	.recap-stats dt {
		font-size: 12px;
		color: var(--muted-foreground);
	}
	.recap-stats dd {
		font-variant-numeric: tabular-nums;
		font-size: 24px;
	}
	@media (min-width: 1024px) {
		.recap-layout {
			grid-template-columns: 320px minmax(0, 1fr);
			gap: 48px;
		}
	}
</style>
