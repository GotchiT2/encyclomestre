<script lang="ts">
	import CollectionVitrine from '$lib/components/profile/collection-vitrine.svelte';
	import {
		countShowcasedCards,
		previewAuctions,
		previewBuyNow,
		previewProfile,
		previewShowcases,
		VITRINE_CARD_LIMIT,
		type PreviewSale,
		type PreviewShowcase
	} from '$lib/components/profile/profile-preview-data';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import TimerIcon from '@lucide/svelte/icons/timer';

	// Écran de présentation : seules les vitrines sont manipulables, et uniquement
	// en mémoire. Rien n'est relié à l'API pour l'instant.
	const amount = new Intl.NumberFormat('fr-FR').format;

	let activeTab = $state<'showcase' | 'sales'>('showcase');
	let showcases = $state<PreviewShowcase[]>(
		previewShowcases.map((showcase) => ({ ...showcase, cards: [...showcase.cards] }))
	);
	let dragged = $state<{ showcaseId: string; cardId: string } | null>(null);

	const shownCount = $derived(countShowcasedCards(showcases));
	const maxPerRow = $derived(Math.max(...showcases.map((showcase) => showcase.perRow)));

	function moveCard(showcaseId: string, cardId: string, delta: -1 | 1) {
		showcases = showcases.map((showcase) => {
			if (showcase.id !== showcaseId) return showcase;
			const from = showcase.cards.findIndex((card) => card.id === cardId);
			const to = from + delta;
			if (from < 0 || to < 0 || to >= showcase.cards.length) return showcase;
			const cards = [...showcase.cards];
			[cards[from], cards[to]] = [cards[to], cards[from]];
			return { ...showcase, cards };
		});
	}

	function removeCard(showcaseId: string, cardId: string) {
		showcases = showcases.map((showcase) =>
			showcase.id === showcaseId
				? { ...showcase, cards: showcase.cards.filter((card) => card.id !== cardId) }
				: showcase
		);
	}

	/** Dépose la carte glissée à `index` dans la vitrine cible, entre vitrines comprises. */
	function dropInto(targetId: string, index: number) {
		const source = dragged;
		dragged = null;
		if (!source) return;
		const card = showcases
			.find((showcase) => showcase.id === source.showcaseId)
			?.cards.find((entry) => entry.id === source.cardId);
		if (!card) return;

		showcases = showcases.map((showcase) => {
			if (showcase.id !== source.showcaseId && showcase.id !== targetId) return showcase;
			let cards = [...showcase.cards];
			if (showcase.id === source.showcaseId) {
				cards = cards.filter((entry) => entry.id !== source.cardId);
			}
			if (showcase.id === targetId) {
				cards.splice(Math.min(index, cards.length), 0, card);
			}
			return { ...showcase, cards };
		});
	}
</script>

<svelte:head><title>{$_('profile.title')}</title></svelte:head>

{#snippet saleTile(sale: PreviewSale, auction: boolean)}
	<article class="forge-panel-flat flex w-44 shrink-0 snap-start flex-col gap-2 p-2 sm:w-48">
		<img
			src={sale.imageUrl}
			alt={sale.title}
			loading="lazy"
			class="aspect-[63/88] w-full object-cover"
		/>
		<p class="truncate text-sm font-bold" title={sale.title}>{sale.title}</p>
		<p class="forge-label text-primary">
			{$_('profile.coins', { values: { amount: amount(sale.price) } })}
		</p>
		{#if auction}
			<p class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
				<GavelIcon class="size-3.5 shrink-0" />
				{$_('profile.bids_count', { values: { count: sale.bids ?? 0 } })}
			</p>
			<p class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
				<TimerIcon class="size-3.5 shrink-0" />
				{$_('profile.ends_in', { values: { delay: sale.endsIn ?? '—' } })}
			</p>
		{:else}
			<Button size="sm" disabled class="mt-auto">{$_('profile.buy_action')}</Button>
		{/if}
	</article>
{/snippet}

<section class="flex flex-col gap-6 pb-12 sm:gap-8">
	<PageHeader eyebrow={$_('profile.title')} title={previewProfile.username} />

	<p class="forge-panel-flat px-4 py-3 text-sm text-muted-foreground">
		{$_('profile.preview_notice')}
	</p>

	<!-- Photo de profil, guilde, compteurs et mots-clés -->
	<header class="forge-panel flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
		<img
			src={previewProfile.avatarUrl}
			alt={previewProfile.username}
			class="aspect-[63/88] w-28 shrink-0 border border-primary/40 object-cover sm:w-32"
		/>

		<div class="flex min-w-0 flex-1 flex-col gap-4">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
				<p class="flex items-center gap-2 text-sm">
					<ShieldIcon class="size-4 shrink-0 text-primary" />
					<span class="forge-label">{$_('profile.guild_label')}</span>
					<span class="font-bold">{previewProfile.guild.name}</span>
				</p>
				<p class="text-xs text-muted-foreground">
					{previewProfile.guild.role} · {$_('profile.guild_members', {
						values: { count: previewProfile.guild.members }
					})}
				</p>
			</div>

			<dl class="grid grid-cols-2 gap-2 sm:max-w-md sm:grid-cols-3">
				{#each [[$_('profile.cards_owned'), previewProfile.cardCount], [$_('profile.unique_cards'), previewProfile.uniqueCount], [$_('profile.member_since'), previewProfile.joinedOn]] as entry (entry[0])}
					<div class="border border-primary/25 bg-background/40 px-3 py-2">
						<dt class="forge-label">{entry[0]}</dt>
						<dd class="mt-1 font-heading text-xl tracking-wider">
							{typeof entry[1] === 'number' ? amount(entry[1]) : entry[1]}
						</dd>
					</div>
				{/each}
			</dl>

			<div>
				<p class="forge-label">{$_('profile.tags_title')}</p>
				<ul class="mt-2 flex flex-wrap gap-1.5">
					{#each previewProfile.tags as tag (tag)}
						<li
							class="border border-primary/30 bg-background/40 px-2 py-0.5 text-[11px] font-bold tracking-wider text-primary uppercase"
						>
							#{tag}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</header>

	<div
		class="grid grid-cols-2 border border-primary/30 bg-card p-1"
		role="tablist"
		aria-label={$_('profile.tabs_aria')}
	>
		{#each [['showcase', $_('profile.tab_showcase')], ['sales', $_('profile.tab_sales')]] as tab (tab[0])}
			<button
				class="h-10 text-[10px] font-bold tracking-widest uppercase {activeTab === tab[0]
					? 'bg-primary text-primary-foreground'
					: 'text-primary'}"
				role="tab"
				id={`profile-tab-${tab[0]}`}
				aria-selected={activeTab === tab[0]}
				aria-controls={`profile-panel-${tab[0]}`}
				onclick={() => (activeTab = tab[0] as typeof activeTab)}
			>
				{tab[1]}
			</button>
		{/each}
	</div>

	{#if activeTab === 'showcase'}
		<div
			class="flex flex-col gap-4"
			id="profile-panel-showcase"
			role="tabpanel"
			aria-labelledby="profile-tab-showcase"
		>
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<p class="text-sm text-muted-foreground">{$_('profile.showcase_hint')}</p>
				<p class="forge-label" aria-live="polite">
					{$_('profile.showcase_capacity', {
						values: { count: shownCount, limit: VITRINE_CARD_LIMIT }
					})}
				</p>
			</div>
			{#each showcases as showcase (showcase.id)}
				<CollectionVitrine
					title={showcase.title}
					cards={showcase.cards}
					perRow={showcase.perRow}
					{maxPerRow}
					onMove={(cardId, delta) => moveCard(showcase.id, cardId, delta)}
					onRemove={(cardId) => removeCard(showcase.id, cardId)}
					onDragStart={(cardId) => (dragged = { showcaseId: showcase.id, cardId })}
					onDragEnd={() => (dragged = null)}
					onDropAt={(index) => dropInto(showcase.id, index)}
				/>
			{/each}
		</div>
	{:else}
		<div
			class="flex flex-col gap-8"
			id="profile-panel-sales"
			role="tabpanel"
			aria-labelledby="profile-tab-sales"
		>
			<!-- Enchères en cours -->
			<div class="flex flex-col gap-3">
				<div class="border-b border-dashed border-primary/30 pb-3">
					<h2 class="text-2xl font-black uppercase">{$_('profile.auctions_title')}</h2>
					<p class="mt-1 text-sm text-muted-foreground">{$_('profile.auctions_hint')}</p>
				</div>
				<div class="flex snap-x gap-3 overflow-x-auto pb-2">
					{#each previewAuctions as sale (sale.id)}
						{@render saleTile(sale, true)}
					{/each}
				</div>
			</div>

			<!-- Achat immédiat -->
			<div class="flex flex-col gap-3">
				<div class="border-b border-dashed border-primary/30 pb-3">
					<h2 class="text-2xl font-black uppercase">{$_('profile.buy_now_title')}</h2>
					<p class="mt-1 text-sm text-muted-foreground">{$_('profile.buy_now_hint')}</p>
				</div>
				<div class="flex snap-x gap-3 overflow-x-auto pb-2">
					{#each previewBuyNow as sale (sale.id)}
						{@render saleTile(sale, false)}
					{/each}
				</div>
			</div>
		</div>
	{/if}
</section>
