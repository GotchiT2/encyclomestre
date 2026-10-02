<script lang="ts">
	import BoosterPackArt from '$lib/components/boosters/booster-pack-art.svelte';
	import ActivityShortcuts from './activity-shortcuts.svelte';
	import { resolve } from '$app/paths';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import HudStat from '$lib/components/layout/hud-stat.svelte';
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

<section class="flex flex-col gap-7">
	<header class="grid gap-5">
		<div>
			<p class="forge-label">{$_('dashboard.eyebrow')}</p>
			<h1 class="mt-2 font-serif text-4xl font-bold tracking-tight sm:text-6xl">
				{$_('dashboard.welcome', { values: { username } })}
			</h1>
			<p class="mt-3 text-muted-foreground">{$_('dashboard.description')}</p>
		</div>
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
			<HudStat
				label={$_('dashboard.cards')}
				value={dashboard ? String(dashboard.collection.totalCopies) : '—'}
				accent
			/>
			<HudStat
				label={$_('dashboard.trades')}
				value={dashboard ? String(dashboard.pendingTrades).padStart(2, '0') : '—'}
			/>
			<HudStat
				label={$_('dashboard.auctions')}
				value={dashboard ? String(dashboard.pendingAuction).padStart(2, '0') : '—'}
			/>
			<HudStat label={$_('dashboard.money')} value={dashboard ? String(dashboard.money) : '—'} />
			<HudStat label={$_('dashboard.rank')} value={rank} />
		</div>
	</header>
	<ActivityShortcuts {dashboard} />
	{#if dashboard?.guild}<Button
			variant="outline"
			href={resolve('/guilds/[id]', { id: String(dashboard.guild.id) })}
			>{dashboard.guild.name}</Button
		>{/if}

	<div class="grid gap-5 xl:grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.2fr)]">
		<ForgePanel class="relative min-w-0 overflow-hidden p-6">
			<div class="relative z-10 w-full max-w-sm">
				<p class="forge-label">
					{$_(
						dashboard?.packs.some((pack) => pack.available > 0)
							? 'dashboard.boosterReady'
							: 'plan.boosters.checkAvailability'
					)}
				</p>
				<h2 class="mt-3 text-3xl font-bold">{$_('dashboard.boosterTitle')}</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					{$_(
						dashboard?.packs.some((pack) => pack.available > 0)
							? 'dashboard.boosterBody'
							: 'plan.boosters.checkAvailability'
					)}
				</p>
				<Button href="/boosters" class="mt-5"
					><PackageOpenIcon />{$_('dashboard.openBooster')}</Button
				>
			</div>
			<div class="mx-auto mt-6 w-40">
				<BoosterPackArt
					name={dashboard?.packs[0]?.name ?? $_('arcade.boosters')}
					renderKey="standard"
				/>
			</div>
		</ForgePanel>

		<ForgePanel class="min-w-0 p-5 sm:p-6">
			<div class="flex items-end justify-between gap-4">
				<div>
					<p class="forge-label">{$_('dashboard.recentEyebrow')}</p>
					<h2 class="mt-2 text-2xl font-bold">{$_('dashboard.recentCards')}</h2>
				</div>
				<Button href="/collection" variant="ghost" size="sm"
					>{$_('dashboard.viewCollection')}<ArrowUpRightIcon /></Button
				>
			</div>
			<div class="mt-6 flex snap-x gap-4 overflow-x-auto pb-3">
				{#each recentCards as card (card.id)}<div class="w-52 shrink-0 snap-start xl:w-[17rem]">
						<CardTile owned {card} showFriendOwners={false} />
					</div>{/each}
			</div>
		</ForgePanel>
	</div>

	<div class="grid gap-4">
		{#if (dashboard?.pendingTrades ?? 0) > 0}<ForgePanel
				class="flex items-center justify-between gap-4 p-5"
				><div>
					<p class="forge-label">{$_('dashboard.tradeSignal')}</p>
					<p class="mt-2 text-xl font-bold">
						{$_('dashboard.tradeTitle', { values: { count: dashboard?.pendingTrades ?? 0 } })}
					</p>
				</div>
				<Button href="/trades" variant="outline"
					><HandshakeIcon />{$_('dashboard.openTrades')}</Button
				></ForgePanel
			>{/if}
		{#if (dashboard?.pendingAuction ?? 0) > 0}<ForgePanel
				class="flex items-center justify-between gap-4 p-5"
				><div>
					<p class="forge-label">{$_('dashboard.auctionSignal')}</p>
					<p class="mt-2 text-xl font-bold">
						{$_('dashboard.auctionTitle', { values: { count: dashboard?.pendingAuction ?? 0 } })}
					</p>
				</div>
				<Button href="/market" variant="outline">{$_('dashboard.openAuctions')}</Button></ForgePanel
			>{/if}
	</div>
</section>
