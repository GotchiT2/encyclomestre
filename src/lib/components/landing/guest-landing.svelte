<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import CardTile from '$lib/components/card-tile.svelte';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import HudStat from '$lib/components/layout/hud-stat.svelte';
	import { mockCards } from '$lib/api/mocks/cards';
	import { _ } from '$lib/i18n';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import PackageOpenIcon from '@lucide/svelte/icons/package-open';

	const showcaseCard = mockCards.find((card) => card.isFullArt) ?? mockCards[0];
</script>

<section
	class="relative grid min-h-[calc(100dvh-9rem)] items-center gap-10 overflow-hidden py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.8fr)] lg:gap-14"
>
	<div class="relative z-10 flex flex-col gap-7">
		<div>
			<p class="forge-label">{$_('landing.eyebrow')}</p>
			<p class="forge-wordmark mt-4 text-5xl sm:text-7xl lg:text-8xl">WikiForge</p>
			<h1
				class="mt-4 max-w-3xl font-serif text-4xl leading-[0.95] font-bold tracking-tight sm:text-6xl"
			>
				{$_('landing.title')}
			</h1>
			<p class="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
				{$_('landing.manifest')}
			</p>
		</div>
		<div class="flex flex-col gap-3 sm:flex-row">
			<Button href="/register" size="lg"><ArrowUpRightIcon />{$_('landing.primaryCta')}</Button>
			<Button href="/cards" variant="outline" size="lg"
				><BookOpenIcon />{$_('landing.secondaryCta')}</Button
			>
		</div>
		<div class="grid grid-cols-3 gap-2">
			<HudStat label={$_('landing.statArticles')} value={$_('landing.statArticlesValue')} accent />
			<HudStat label={$_('landing.statCollectors')} value={$_('landing.statCollectorsValue')} />
			<HudStat label={$_('landing.statTrades')} value={$_('landing.statTradesValue')} />
		</div>
	</div>

	<div
		class="relative mx-auto flex w-full max-w-xl items-center justify-center pb-8 sm:min-h-[38rem]"
	>
		<div class="forge-energy-orbit absolute inset-0"></div>
		<div class="absolute right-0 bottom-0 z-20 w-32 rotate-8 sm:w-44">
			<img src="/images/booster.png" alt="" class="forge-booster-idle w-full" />
		</div>
		<div class="relative z-10 max-w-sm -rotate-2" data-testid="full-art-frame">
			<CardTile card={showcaseCard} showFriendOwners={false} />
		</div>
		<ForgePanel class="absolute right-3 bottom-4 z-30 hidden p-3 sm:block">
			<a
				href="/boosters"
				class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-primary uppercase"
			>
				<PackageOpenIcon class="size-4" />{$_('landing.openPack')}
			</a>
		</ForgePanel>
	</div>
</section>

<section class="grid gap-4 py-12 sm:grid-cols-3">
	{#each ['landing.loopDiscover', 'landing.loopCollect', 'landing.loopTrade'] as key, index (key)}
		<ForgePanel class="min-h-40 p-5">
			<p class="font-heading text-4xl text-primary/35">0{index + 1}</p>
			<h2 class="mt-4 font-serif text-xl font-bold">{$_(`${key}Title`)}</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{$_(`${key}Body`)}</p>
		</ForgePanel>
	{/each}
</section>
