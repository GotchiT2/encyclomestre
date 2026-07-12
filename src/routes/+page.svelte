<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';

	const statistics = [
		{ label: 'landing.statArticles', value: 'landing.statArticlesValue' },
		{ label: 'landing.statCollectors', value: 'landing.statCollectorsValue' },
		{ label: 'landing.statTrades', value: 'landing.statTradesValue' }
	];
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

	<div class="alchemy-frame p-4" data-testid="full-art-frame">
		<div class="border border-primary/20 bg-background p-2">
			<div
				class="relative flex aspect-[3/4] flex-col justify-between overflow-hidden bg-secondary p-5"
				role="img"
				aria-label={$_('landing.fullArtAria')}
			>
				<div
					class="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgb(193_154_107_/_36%),transparent_24%),linear-gradient(145deg,#121614_0%,#080a09_56%,#0e1210_100%)]"
				></div>
				<div class="relative flex items-start justify-between gap-4">
					<span class="alchemy-label">{$_('landing.ledger')}</span>
					<span
						class="border border-primary/40 px-2 py-1 font-serif text-xl font-black text-primary"
						>L</span
					>
				</div>
				<div class="relative flex flex-col gap-3 border-t border-primary/40 pt-4">
					<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
						{$_('landing.cardSubtitle')}
					</p>
					<h2
						class="font-serif text-4xl font-black uppercase leading-none tracking-tight text-foreground"
					>
						{$_('landing.cardTitle')}
					</h2>
					<p class="font-serif text-sm italic leading-relaxed text-foreground/80">
						{$_('landing.cardDescription')}
					</p>
					<div
						class="flex items-center justify-between border-t border-dashed border-primary/30 pt-3"
					>
						<span class="font-mono text-[9px] uppercase tracking-widest text-primary"
							>{$_('landing.rarity')}</span
						>
						<span class="font-mono text-[8px] uppercase tracking-widest text-muted-foreground"
							>{$_('landing.serial')}</span
						>
					</div>
				</div>
			</div>
		</div>
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
