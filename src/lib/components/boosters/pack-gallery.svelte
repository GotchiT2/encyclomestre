<script lang="ts">
	import { _ } from '$lib/i18n';
	import { onMount, type Snippet } from 'svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { arcadePreferences } from '$lib/arcade/preferences';
	import BoosterPackArt from './booster-pack-art.svelte';
	import PackCatalogue from './pack-catalogue.svelte';
	import { packNameKey } from './pack-labels';
	import type { PackCatalogueItem } from '$lib/types';
	let {
		packs,
		selectedId,
		onSelect,
		onDetails,
		onTear = () => undefined,
		locked = false,
		active = true,
		actions,
		credits
	}: {
		packs: PackCatalogueItem[];
		selectedId: number | null;
		onSelect: (pack: PackCatalogueItem) => void;
		onDetails: (pack: PackCatalogueItem) => void;
		onTear?: () => void;
		locked?: boolean;
		active?: boolean;
		actions?: Snippet;
		credits?: Snippet;
	} = $props();
	let allOpen = $state(false);
	let carousel = $state.raw<EmblaCarouselType>();
	let systemReduced = $state(false);
	let gesture: { x: number; y: number; tear: boolean } | null = null;
	const available = $derived(
		packs.filter((pack) => pack.status === 'OPEN' && (pack.credit?.available ?? 0) > 0)
	);
	const selected = $derived(packs.find((pack) => pack.id === selectedId));
	const slides = $derived(
		selected && !available.some((pack) => pack.id === selected.id)
			? [...available, selected]
			: available
	);
	const selectedIndex = $derived(slides.findIndex((pack) => pack.id === selectedId));
	const previous = $derived(slides[selectedIndex - 1]);
	const next = $derived(slides[selectedIndex + 1]);
	const reduced = $derived($arcadePreferences.motion === 'reduce' || systemReduced);
	const carouselOptions: EmblaOptionsType = $derived({
		align: 'center',
		containScroll: false,
		loop: false,
		duration: reduced ? 0 : 24,
		watchDrag: (_api, event) => {
			const point = 'touches' in event ? event.touches[0] : event;
			const box = _api.rootNode().getBoundingClientRect();
			return Boolean(active && !locked && point && point.clientY >= box.top + box.height * 0.28);
		}
	});
	onMount(() => {
		const media = matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => (systemReduced = media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	});
	function initCarousel(event: CustomEvent<EmblaCarouselType>) {
		carousel = event.detail;
		carousel.scrollTo(Math.max(0, selectedIndex), true);
		carousel.on('select', (api) => {
			const pack = slides[api.selectedScrollSnap()];
			if (pack && pack.id !== selectedId && active && !locked) onSelect(pack);
		});
		carousel.on('pointerUp', (api) => {
			if (reduced) api.scrollTo(api.selectedScrollSnap(), true);
		});
		carousel.on('reInit', (api) => {
			if (selectedIndex >= 0) api.scrollTo(selectedIndex, true);
		});
	}
	$effect(() => {
		const api = carousel;
		const index = selectedIndex;
		if (api && index >= 0 && index !== api.selectedScrollSnap()) api.scrollTo(index, reduced);
	});
	const name = (pack: PackCatalogueItem) => {
		const key = packNameKey(pack.name);
		return key ? $_(key) : pack.name;
	};
	function endGesture(event: PointerEvent) {
		if (!gesture || locked) {
			gesture = null;
			return;
		}
		const dx = event.clientX - gesture.x,
			dy = event.clientY - gesture.y;
		if (Math.abs(dx) >= 70 && Math.abs(dy) < 70) {
			if (gesture.tear && selected?.status === 'OPEN' && selected.credit?.available) onTear();
		}
		gesture = null;
	}
</script>

<section class="booster-reserve" data-testid="booster-reserve">
	<div class="reserve-heading">
		<div>
			<p>{$_('opening.room')}</p>
			<h1>{$_('opening.title')}</h1>
		</div>
		<Button variant="outline" onclick={() => (allOpen = true)} disabled={locked}
			>{$_('arcade.allPacks')}</Button
		>
	</div>
	{#if credits}<div class="reserve-credits">{@render credits()}</div>{/if}
	<div class="reserve-plateau">
		<div class="plateau-index" aria-hidden="true">
			WF / <span>{$_('opening.sessionLabel')}</span>
		</div>
		<div class="pack-cartouche">
			{#if selected}<span
					>{$_('boosters.family.' + selected.family, { default: selected.family })} · {$_(
						'boosters.pack_card_count',
						{ values: { count: selected.nbCards } }
					)}</span
				>
				<h2>{name(selected)}</h2>{:else}<h2>
					{$_(packs.length ? 'arcade.noAvailablePacks' : 'opening.empty')}
				</h2>{/if}
		</div>
		<div
			class="hero-lane"
			class:reduced
			role="presentation"
			onpointerdown={(event) => {
				const box = event.currentTarget.getBoundingClientRect();
				gesture = {
					x: event.clientX,
					y: event.clientY,
					tear: event.clientY < box.top + box.height * 0.28
				};
			}}
			onpointerup={endGesture}
			onpointercancel={() => (gesture = null)}
		>
			<div
				class="pack-viewport"
				data-testid="pack-carousel"
				data-ready={Boolean(carousel)}
				use:emblaCarouselSvelte={{ options: carouselOptions, plugins: [] }}
				onemblaInit={initCarousel}
			>
				<div class="pack-track">
					{#each slides as pack (pack.id)}
						<div class="pack-slide" data-slide-id={pack.id}>
							<button
								type="button"
								class="pack-object"
								class:chosen={pack.id === selectedId}
								aria-label={name(pack)}
								aria-pressed={pack.id === selectedId}
								disabled={locked}
								onclick={() => pack.id !== selectedId && onSelect(pack)}
							>
								<BoosterPackArt
									name={name(pack)}
									renderKey={pack.renderKey}
									family={pack.family}
									cardCount={pack.nbCards}
								/>
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
		{#if selected?.status === 'OPEN' && selected.credit?.available}<button
				class="tear-invitation"
				data-testid="pack-tear-handle"
				disabled={locked}
				onclick={onTear}>{$_('opening.tear')} <span aria-hidden="true">↗</span></button
			>{/if}
		<div class="plateau-base">
			<div class="pack-navigation">
				<Button
					variant="ghost"
					size="icon"
					disabled={!previous || locked}
					onclick={() => previous && onSelect(previous)}
					aria-label={$_('arcade.previousPack')}>←</Button
				><Button
					variant="ghost"
					size="icon"
					disabled={!next || locked}
					onclick={() => next && onSelect(next)}
					aria-label={$_('arcade.nextPack')}>→</Button
				>{#if selected}<Button variant="ghost" onclick={() => onDetails(selected)} disabled={locked}
						>{$_('opening.contents')}</Button
					>{/if}
			</div>
			<div class="reserve-actions">
				{#if actions}{@render actions()}{/if}
			</div>
		</div>
	</div>
	{#if available.length}<nav class="reserve-dock" aria-label={$_('arcade.availablePacks')}>
			{#each available as pack (pack.id)}<button
					type="button"
					class:chosen={pack.id === selectedId}
					aria-pressed={pack.id === selectedId}
					disabled={locked}
					onclick={() => onSelect(pack)}
					data-pack-id={pack.id}
					><div class="dock-art">
						<BoosterPackArt name={name(pack)} renderKey={pack.renderKey} family={pack.family} />
					</div>
					<span>{name(pack)}</span><i aria-hidden="true"></i></button
				>{/each}
		</nav>{:else}<p class="reserve-empty" role="status">{$_('opening.noAvailable')}</p>{/if}
</section>
<Dialog.Root bind:open={allOpen}
	><Dialog.Content class="overflow-y-auto p-4 sm:p-5"
		><Dialog.Header
			><Dialog.Title>{$_('arcade.allPacks')}</Dialog.Title><Dialog.Description
				>{$_('opening.allHint')}</Dialog.Description
			></Dialog.Header
		><PackCatalogue
			{packs}
			onDetails={(pack) => {
				allOpen = false;
				onDetails(pack);
			}}
			onOpen={(pack) => {
				allOpen = false;
				onSelect(pack);
			}}
		/></Dialog.Content
	></Dialog.Root
>

<style>
	.booster-reserve {
		min-width: 0;
		display: grid;
		gap: 14px;
		padding-bottom: 8px;
	}
	.reserve-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 12px;
	}
	.reserve-heading p {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: #e8ef42;
	}
	h1 {
		font:
			800 clamp(30px, 4vw, 52px)/0.95 'Barlow Condensed',
			sans-serif;
		text-transform: uppercase;
	}
	h1,
	h2 {
		margin: 0;
	}
	.reserve-plateau {
		position: relative;
		min-width: 0;
		overflow: hidden;
		isolation: isolate;
		border: 1px solid #efebd92a;
		background: radial-gradient(ellipse at 50% 65%, #2e3322, transparent 58%), #10120f;
	}
	.reserve-plateau::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		width: 36px;
		height: 3px;
		background: #e8ef42;
	}
	.plateau-index {
		position: absolute;
		right: 20px;
		top: 20px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		color: #efebd95a;
	}
	.plateau-index span {
		color: #efebd932;
	}
	.pack-cartouche {
		position: relative;
		padding: 20px 20px 0;
		z-index: 2;
		max-width: 65%;
	}
	.pack-cartouche span {
		font-size: 11px;
		color: #efebd9a6;
	}
	h2 {
		font:
			700 clamp(22px, 3vw, 34px)/1.05 'Barlow Condensed',
			sans-serif;
		overflow-wrap: anywhere;
	}
	.hero-lane {
		position: relative;
		width: 100%;
		height: clamp(310px, 42dvh, 450px);
		touch-action: pan-y;
	}
	.pack-viewport {
		height: 100%;
		overflow: hidden;
	}
	.pack-track {
		display: flex;
		height: 100%;
		touch-action: pan-y pinch-zoom;
	}
	.pack-slide {
		flex: 0 0 36%;
		min-width: 0;
		display: grid;
		place-items: center;
		padding: 16px;
	}
	.pack-object {
		width: min(100%, 210px);
		min-height: 44px;
		padding: 0;
		border: 0;
		background: none;
		position: relative;
		transform: perspective(900px) rotateY(-8deg);
		opacity: 0.55;
		transition: opacity 160ms;
	}
	.pack-object:focus-visible {
		outline: 2px solid #e8ef42;
		outline-offset: 7px;
	}
	.pack-object.chosen {
		opacity: 1;
	}
	.pack-object::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(110deg, #fff0 20%, #ffffff12 42%, #fff0 64%);
		border-right: 3px solid #efebd936;
		border-radius: 3px;
		pointer-events: none;
	}
	.hero-lane.reduced .pack-object {
		transform: none;
		transition: none;
	}
	.tear-invitation {
		display: block;
		margin: -10px auto 6px;
		position: relative;
		z-index: 3;
		padding: 0 14px;
		min-height: 44px;
		font-size: 12px;
		color: #efebd99a;
		background: transparent;
		border: 0;
	}
	.tear-invitation span {
		color: #e8ef42;
	}
	.tear-invitation:focus-visible {
		outline: 2px solid #e8ef42;
	}
	.plateau-base {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: end;
		justify-content: space-between;
		padding: 12px 20px 20px;
		border-top: 1px solid #efebd915;
	}
	.pack-navigation {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}
	.reserve-actions {
		min-width: 0;
	}
	.reserve-dock {
		display: flex;
		gap: 12px;
		padding: 12px 4px 4px;
		overflow-x: auto;
		scrollbar-width: thin;
	}
	.reserve-dock button {
		position: relative;
		min-height: 44px;
		flex: 0 0 120px;
		display: grid;
		grid-template-columns: 40px 1fr;
		gap: 10px;
		align-items: center;
		border: 1px solid #efebd925;
		padding: 8px;
		background: #1a1d17;
		color: #efebd999;
		transition:
			border-color 160ms,
			color 160ms;
	}
	.reserve-dock .chosen {
		border-color: #e8ef42;
		color: #efebd9;
	}
	.reserve-dock button:focus-visible {
		outline: 2px solid #e8ef42;
		outline-offset: 2px;
	}
	.dock-art {
		width: 36px;
	}
	.reserve-dock span {
		text-align: left;
		font:
			600 14px/1.05 'Barlow Condensed',
			sans-serif;
		overflow-wrap: anywhere;
	}
	.reserve-dock i {
		position: absolute;
		height: 3px;
		background: #e8ef42;
		bottom: -1px;
		left: 8px;
		right: 8px;
		opacity: 0;
	}
	.chosen i {
		opacity: 1;
	}
	.reserve-empty {
		padding: 16px;
		border: 1px dashed #efebd930;
		font-size: 14px;
		color: #efebd999;
	}
	@media (min-width: 768px) {
		.reserve-dock button {
			flex-basis: 165px;
		}
	}
	@media (max-width: 767px) {
		h1 {
			font-size: 26px;
		}
		.tear-invitation {
			display: none;
		}
		.plateau-index span {
			display: none;
		}
		.plateau-index {
			top: 18px;
			right: 16px;
		}
		.pack-cartouche {
			padding: 16px 16px 0;
			max-width: 80%;
		}
		.hero-lane {
			height: 210px;
		}
		.pack-slide {
			flex-basis: 60%;
			padding: 12px;
		}
		.pack-object {
			width: min(100%, 120px);
		}
		.plateau-base {
			display: grid;
			padding: 6px 12px 12px;
			gap: 4px;
		}
		.pack-navigation {
			justify-content: center;
			order: 2;
		}
		.reserve-actions {
			width: 100%;
		}
		.reserve-heading {
			align-items: center;
		}
		.reserve-heading :global(button) {
			max-width: 125px;
			font-size: 12px;
		}
	}
</style>
