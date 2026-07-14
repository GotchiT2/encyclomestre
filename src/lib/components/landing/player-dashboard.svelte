<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import HudStat from '$lib/components/layout/hud-stat.svelte';
	import { mockCards } from '$lib/api/mocks/cards';
	import { _ } from '$lib/i18n';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import HandshakeIcon from '@lucide/svelte/icons/handshake';
	import PackageOpenIcon from '@lucide/svelte/icons/package-open';

	let { username }: { username: string } = $props();
	const recentCards = mockCards.slice(0, 3);
</script>

<section class="flex flex-col gap-7">
	<header class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
		<div>
			<p class="forge-label">{$_('dashboard.eyebrow')}</p>
			<h1 class="mt-2 font-serif text-4xl font-bold tracking-tight sm:text-6xl">
				{$_('dashboard.welcome', { values: { username } })}
			</h1>
			<p class="mt-3 text-muted-foreground">{$_('dashboard.description')}</p>
		</div>
		<div class="grid grid-cols-3 gap-2">
			<HudStat label={$_('dashboard.cards')} value="128" accent />
			<HudStat label={$_('dashboard.trades')} value="03" />
			<HudStat label={$_('dashboard.rank')} value="A-17" />
		</div>
	</header>

	<div class="grid gap-5 xl:grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.2fr)]">
		<ForgePanel class="relative min-h-[28rem] min-w-0 overflow-hidden p-6">
			<div class="relative z-10 w-full max-w-sm">
				<p class="forge-label">{$_('dashboard.boosterReady')}</p>
				<h2 class="mt-3 font-serif text-3xl font-bold">{$_('dashboard.boosterTitle')}</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					{$_('dashboard.boosterBody')}
				</p>
				<Button href="/boosters" class="mt-5"
					><PackageOpenIcon />{$_('dashboard.openBooster')}</Button
				>
			</div>
			<img
				src="/images/booster.png"
				alt=""
				class="forge-booster-idle absolute right-2 bottom-[-4rem] w-52 sm:right-8 sm:w-64"
			/>
		</ForgePanel>

		<ForgePanel class="min-w-0 p-5 sm:p-6">
			<div class="flex items-end justify-between gap-4">
				<div>
					<p class="forge-label">{$_('dashboard.recentEyebrow')}</p>
					<h2 class="mt-2 font-serif text-2xl font-bold">{$_('dashboard.recentCards')}</h2>
				</div>
				<Button href="/collection" variant="ghost" size="sm"
					>{$_('dashboard.viewCollection')}<ArrowUpRightIcon /></Button
				>
			</div>
			<div class="mt-6 flex snap-x gap-4 overflow-x-auto pb-3">
				{#each recentCards as card (card.id)}<div class="w-52 shrink-0 snap-start xl:w-[17rem]">
						<CardTile {card} showFriendOwners={false} />
					</div>{/each}
			</div>
		</ForgePanel>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<ForgePanel class="flex items-center justify-between gap-4 p-5"
			><div>
				<p class="forge-label">{$_('dashboard.tradeSignal')}</p>
				<p class="mt-2 font-serif text-xl font-bold">{$_('dashboard.tradeTitle')}</p>
			</div>
			<Button href="/trades" variant="outline"><HandshakeIcon />{$_('dashboard.openTrades')}</Button
			></ForgePanel
		>
		<ForgePanel class="flex items-center justify-between gap-4 p-5"
			><div>
				<p class="forge-label">{$_('dashboard.marketSignal')}</p>
				<p class="mt-2 font-serif text-xl font-bold">{$_('dashboard.marketTitle')}</p>
			</div>
			<Button href="/market" variant="outline"
				>{$_('dashboard.openMarket')}<ArrowUpRightIcon /></Button
			></ForgePanel
		>
	</div>
</section>
