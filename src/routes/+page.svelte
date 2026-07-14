<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import CardTile from '$lib/components/card-tile.svelte';
	import { mockCards } from '$lib/api/mocks/cards';
	import { _ } from '$lib/i18n';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';

	const statistics = [
		{ label: 'landing.statArticles', value: 'landing.statArticlesValue' },
		{ label: 'landing.statCollectors', value: 'landing.statCollectorsValue' },
		{ label: 'landing.statTrades', value: 'landing.statTradesValue' }
	];
	const showcaseCard = mockCards.find((card) => card.isFullArt) ?? mockCards[0];
</script>

<svelte:head><title>{$_('app.title')}</title></svelte:head>

<section
	class="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.78fr)] lg:gap-16"
>
	<div class="flex flex-col gap-7">
		<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
			{$_('landing.eyebrow')}
		</p>
		<div class="flex flex-col gap-4">
			<h1
				class="max-w-3xl font-serif text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
			>
				{$_('landing.title')}
			</h1>
			<p
				class="max-w-xl font-serif text-base italic leading-relaxed text-muted-foreground sm:text-lg"
			>
				{$_('landing.manifest')}
			</p>
		</div>
		<div class="flex flex-col gap-3 sm:flex-row">
			<Button href="/register" size="lg"
				><ArrowUpRightIcon data-icon="inline-start" />{$_('landing.primaryCta')}</Button
			>
			<Button href="/cards" variant="outline" size="lg"
				><BookOpenIcon data-icon="inline-start" />{$_('landing.secondaryCta')}</Button
			>
		</div>
		<dl
			class="grid grid-cols-3 divide-x divide-primary/20 border-y border-dashed border-primary/30 py-4"
		>
			{#each statistics as statistic (statistic.label)}
				<div class="flex flex-col gap-1 px-3 first:pl-0">
					<dt
						class="font-mono text-[8px] uppercase tracking-widest text-muted-foreground sm:text-[9px]"
					>
						{$_(statistic.label)}
					</dt>
					<dd class="font-mono text-sm uppercase tracking-widest text-primary sm:text-base">
						{$_(statistic.value)}
					</dd>
				</div>
			{/each}
		</dl>
	</div>

	<div class="mx-auto flex w-full max-w-sm justify-center" data-testid="full-art-frame">
		<CardTile card={showcaseCard} showFriendOwners={false} />
	</div>
</section>

<section class="mt-16 border-t border-dashed border-primary/30 pt-8 sm:mt-24 sm:pt-12">
	<p
		class="max-w-2xl font-serif text-3xl font-light italic leading-tight text-foreground sm:text-4xl"
	>
		{$_('landing.principleTitle')}
	</p>
	<p class="mt-4 max-w-2xl font-serif text-sm italic leading-relaxed text-muted-foreground">
		{$_('landing.principleBody')}
	</p>
</section>
