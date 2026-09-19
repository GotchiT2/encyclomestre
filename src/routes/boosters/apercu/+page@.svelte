<script lang="ts">
	// Reset to the root layout: this local demo does not require a player session.
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import VariantCard from '$lib/components/boosters/preview/variant-card.svelte';
	import PackCatalogue from '$lib/components/boosters/preview/pack-catalogue.svelte';
	import PackDetail from '$lib/components/boosters/preview/pack-detail.svelte';
	import CardDetail from '$lib/components/boosters/preview/card-detail.svelte';
	import VariantGallery from '$lib/components/boosters/preview/variant-gallery.svelte';
	import Opening from '$lib/components/boosters/preview/opening.svelte';
	import {
		packs,
		previewCard,
		createSession,
		restoreSession,
		openPreviewPack,
		scenarios,
		STORAGE_KEY,
		type PreviewCard,
		type PreviewPack,
		type Scenario
	} from '$lib/components/boosters/preview/catalogue';

	let session = $state(createSession());
	let ready = $state(false);
	let now = $state(Date.now());
	let storageUnavailable = $state(false);
	let openingError = $state(false);
	let selectedPack = $state<PreviewPack | null>(null);
	let selectedCard = $state<PreviewCard | null>(null);
	let opening = $state<{ pack: PreviewPack; cards: PreviewCard[] } | null>(null);
	const missingImage = $derived(session.scenario === 'missing-image');

	onMount(() => {
		try {
			session = restoreSession(sessionStorage.getItem(STORAGE_KEY));
		} catch {
			storageUnavailable = true;
		}
		ready = true;
		const timer = window.setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => window.clearInterval(timer);
	});

	function save() {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
			storageUnavailable = false;
		} catch {
			storageUnavailable = true;
		}
	}
	function reset(scenario: Scenario = 'normal') {
		session = createSession(scenario);
		selectedPack = null;
		selectedCard = null;
		opening = null;
		openingError = false;
		save();
	}
	function open(pack: PreviewPack) {
		if (!ready || opening) return;
		openingError = false;
		try {
			const result = openPreviewPack(pack, session);
			session = result.session;
			save();
			selectedPack = null;
			opening = { pack, cards: result.cards };
		} catch {
			openingError = true;
		}
	}
	const openCard = (card: PreviewCard) => {
		selectedCard = card;
	};
</script>

<svelte:head
	><title>{$_('boosterPreview.page_title')}</title><meta
		name="robots"
		content="noindex"
	/></svelte:head
>

<div class="preview-page flex flex-col gap-10 sm:gap-14">
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
		<p class="flex items-center gap-2 text-xs text-muted-foreground">
			<span class="size-1.5 rounded-full bg-energy-soft"></span>{$_(
				'boosterPreview.simulation_banner'
			)}
		</p>
		<Button variant="ghost" size="sm" onclick={() => reset()} disabled={!ready}
			>{$_('boosterPreview.reset')}</Button
		>
	</div>
	<section class="preview-hero">
		<div class="hero-copy">
			<p class="forge-label">{$_('boosterPreview.hero_eyebrow')}</p>
			<h1>{$_('boosterPreview.hero_title')}<span>{$_('boosterPreview.hero_emphasis')}</span></h1>
			<p class="hero-description">{$_('boosterPreview.hero_description')}</p>
			<div class="mt-7 flex flex-wrap gap-3">
				<a class={buttonVariants()} href="#pack-catalogue">{$_('boosterPreview.explore')}</a><a
					class={buttonVariants({ variant: 'outline' })}
					href="#variant-gallery">{$_('boosterPreview.compare')}</a
				>
			</div>
			<p class="mt-7 text-xs tracking-wide text-muted-foreground">
				{$_('boosterPreview.hero_footer')}
			</p>
		</div>
		<div class="hero-showcase" aria-hidden="true">
			<div class="hero-ring"></div>
			<div class="hero-card hero-left">
				<VariantCard card={previewCard(packs[2], 9, 'star-wars')} decorative />
			</div>
			<div class="hero-card hero-right">
				<VariantCard card={previewCard(packs[1], 7, 'rose')} decorative />
			</div>
			<div class="hero-card hero-center">
				<VariantCard card={previewCard(packs[4], 5, 'karina')} decorative />
			</div>
			<span class="hero-caption">{$_('boosterPreview.hero_caption')}</span>
		</div>
	</section>
	{#if storageUnavailable}<p
			role="status"
			class="border border-primary/40 p-4 text-sm text-primary"
		>
			{$_('boosterPreview.storage_unavailable')}
		</p>{/if}
	{#if openingError}<p
			role="alert"
			class="border border-destructive/40 p-4 text-sm text-destructive"
		>
			{$_('boosterPreview.opening_error')}
		</p>{/if}
	<PackCatalogue
		{session}
		{now}
		busy={!ready || Boolean(opening)}
		onDetail={(pack) => {
			selectedPack = pack;
		}}
		onOpen={open}
	/>
	<VariantGallery onOpenCard={openCard} {missingImage} />
	<details class="border-t border-border pt-5 text-sm text-muted-foreground">
		<summary class="cursor-pointer py-2">{$_('boosterPreview.demo_controls')}</summary>
		<div class="mt-3 flex flex-wrap items-center gap-4">
			<label for="demo-scenario">{$_('boosterPreview.scenario')}</label><select
				id="demo-scenario"
				class="max-w-full border-border bg-card text-sm text-foreground"
				value={session.scenario}
				onchange={(event) => reset(event.currentTarget.value as Scenario)}
				>{#each scenarios as scenario (scenario)}<option value={scenario}
						>{$_(`boosterPreview.scenarios.${scenario}`)}</option
					>{/each}</select
			>
			<p class="text-xs">{$_('boosterPreview.scenario_note')}</p>
		</div>
	</details>
</div>

{#if selectedPack}<PackDetail
		pack={selectedPack}
		{session}
		{now}
		{missingImage}
		onClose={() => (selectedPack = null)}
		onOpen={open}
		onOpenCard={openCard}
	/>{/if}
{#if opening}<Opening
		pack={opening.pack}
		cards={opening.cards}
		{missingImage}
		onClose={() => (opening = null)}
		onOpenCard={openCard}
	/>{/if}
{#if selectedCard}<CardDetail
		card={selectedCard}
		{missingImage}
		onClose={() => (selectedCard = null)}
	/>{/if}

<style>
	.preview-page {
		max-width: 1320px;
		margin-inline: auto;
	}
	.preview-hero {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		gap: 30px;
		align-items: center;
		min-height: 410px;
	}
	h1 {
		margin-top: 16px;
		font: 700 clamp(38px, 4.3vw, 64px) / 1.04 var(--font-serif);
		letter-spacing: -0.045em;
	}
	h1 span {
		display: block;
		color: var(--primary);
	}
	.hero-description {
		margin-top: 22px;
		max-width: 450px;
		color: #aebed3;
		font-size: 17px;
		line-height: 1.6;
	}
	.hero-showcase {
		position: relative;
		height: 410px;
		isolation: isolate;
	}
	.hero-card {
		position: absolute;
		width: 185px;
		pointer-events: none;
	}
	.hero-left {
		left: 1%;
		top: 53px;
		transform: rotate(-16deg);
	}
	.hero-right {
		right: 1%;
		top: 53px;
		transform: rotate(16deg);
	}
	.hero-center {
		width: 205px;
		left: calc(50% - 102px);
		top: 16px;
		z-index: 2;
	}
	.hero-ring {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, #98488125, #376ac015 40%, transparent 67%);
	}
	.hero-caption {
		position: absolute;
		bottom: 25px;
		left: 0;
		right: 0;
		text-align: center;
		color: #a6b6ce;
		font-size: 10px;
		letter-spacing: 0.25em;
		text-transform: uppercase;
	}
	@media (max-width: 1000px) {
		.preview-hero {
			grid-template-columns: 1fr 1fr;
		}
		.hero-card {
			width: 145px;
		}
		.hero-center {
			width: 175px;
			left: calc(50% - 87px);
			top: 38px;
		}
		.hero-left,
		.hero-right {
			top: 75px;
		}
	}
	@media (max-width: 760px) {
		.preview-hero {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.hero-showcase {
			height: 325px;
			max-width: 420px;
			width: 100%;
			margin: auto;
		}
		.hero-center {
			top: 15px;
		}
		.hero-left,
		.hero-right {
			top: 45px;
		}
		.hero-caption {
			bottom: 10px;
		}
		h1 {
			font-size: clamp(36px, 8vw, 52px);
		}
	}
</style>
