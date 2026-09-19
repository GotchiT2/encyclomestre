<script lang="ts">
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import type { EmblaCarouselType } from 'embla-carousel';
	import BoosterRevealCard from './booster-reveal-card.svelte';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import HudStat from '$lib/components/layout/hud-stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { CardRecord } from '$lib/types';

	type BoosterPhase = 'idle' | 'opening' | 'dealing' | 'revealing' | 'complete' | 'error';
	type BoosterSlot = { card: CardRecord; revealed: boolean };

	let {
		available,
		maximum,
		nextDelay,
		opening,
		openingId = 0,
		packName,
		packImage,
		cards,
		error = false,
		suspended = false,
		onOpen,
		onReset,
		onOpenCard = () => undefined
	}: {
		available: number;
		maximum: number;
		nextDelay?: string;
		opening: boolean;
		openingId?: number;
		packName: string;
		packImage: string;
		cards: CardRecord[] | null;
		error?: boolean;
		suspended?: boolean;
		onOpen: () => void;
		onReset: () => void;
		onOpenCard?: (card: CardRecord) => void;
	} = $props();

	const quickPreferenceKey = 'wikiforge.booster.quick-opening';
	let phase = $state<BoosterPhase>('idle');
	let slots = $state<BoosterSlot[]>([]);
	let handledOpeningId = $state(-1);
	let mobileIndex = $state(0);
	let quickOpening = $state(false);
	let preferenceReady = $state(false);
	let openRequested = $state(false);
	let suspensionActive = $state(false);
	let mobileViewport = $state(false);
	let deckElement = $state<HTMLDivElement>();
	let carouselApi = $state<EmblaCarouselType>();
	const mobileSceneActive = $derived(
		mobileViewport && ['dealing', 'revealing', 'complete'].includes(phase)
	);
	const boosterCarouselOptions = $derived({
		active: mobileViewport && phase === 'complete',
		align: 'center' as const,
		containScroll: 'trimSnaps' as const,
		dragFree: true
	});
	const awaitingMobileSummary = $derived(
		mobileViewport &&
			!quickOpening &&
			phase === 'revealing' &&
			slots.length > 0 &&
			slots.every((slot) => slot.revealed)
	);
	let timers: number[] = [];
	function schedule(callback: () => void, delay: number) {
		const timer = window.setTimeout(callback, delay);
		timers.push(timer);
	}

	function clearTimers() {
		for (const timer of timers) window.clearTimeout(timer);
		timers = [];
	}

	function setSlotRevealed(index: number) {
		if (!slots[index] || slots[index].revealed || phase === 'opening') return;
		slots[index] = { ...slots[index], revealed: true };
		const remaining = slots.some((slot) => !slot.revealed);
		if (!remaining) {
			mobileIndex = slots.length - 1;
			if (mobileViewport && !quickOpening) phase = 'revealing';
			else phase = 'complete';
			return;
		}
		phase = 'revealing';
		if (index === mobileIndex)
			schedule(() => (mobileIndex = Math.min(index + 1, slots.length - 1)), 680);
	}

	function startDeal(nextCards: CardRecord[], nextOpeningId: number) {
		clearTimers();
		openRequested = false;
		handledOpeningId = nextOpeningId;
		slots = nextCards.map((card) => ({ card, revealed: false }));
		mobileIndex = 0;
		phase = 'dealing';
		if (suspended) return;
		if (quickOpening) {
			slots = slots.map((slot) => ({ ...slot, revealed: true }));
			phase = 'complete';
		} else {
			schedule(() => (phase = 'revealing'), 720);
		}
	}

	async function showMobileCard(index: number, behavior: ScrollBehavior = 'smooth') {
		mobileIndex = Math.max(0, Math.min(index, slots.length - 1));
		await tick();
		if (carouselApi) {
			carouselApi.scrollTo(mobileIndex, behavior !== 'smooth');
			return;
		}
		const target = deckElement?.querySelector<HTMLElement>(`[data-slot-index="${mobileIndex}"]`);
		target?.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
	}

	function handleCarouselInit(event: CustomEvent<EmblaCarouselType>) {
		carouselApi = event.detail;
		const updateIndex = () => {
			if (phase === 'complete') mobileIndex = carouselApi?.selectedScrollSnap() ?? 0;
		};
		carouselApi.on('select', updateIndex);
		carouselApi.on('reInit', updateIndex);
	}

	function revealNext() {
		if (phase !== 'revealing') return;
		const nextIndex = slots.findIndex((slot) => !slot.revealed);
		if (nextIndex >= 0) setSlotRevealed(nextIndex);
	}

	function requestOpen() {
		if (!available || opening || openRequested || suspended) return;
		openRequested = true;
		onOpen();
	}

	function advance() {
		if (suspended) return;
		if (phase === 'revealing') {
			if (awaitingMobileSummary) {
				phase = 'complete';
				void showMobileCard(0, 'auto');
				return;
			}
			revealNext();
			return;
		}
		if (phase === 'complete') requestOpen();
	}

	function isInteractiveTarget(target: EventTarget | null) {
		return target instanceof Element && Boolean(target.closest('[data-booster-interactive]'));
	}

	function handleStageClick(event: MouseEvent) {
		if (suspended) return;
		if (event.currentTarget !== event.target && isInteractiveTarget(event.target)) return;
		advance();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (suspended) return;
		if (event.code !== 'Space' || event.repeat || isInteractiveTarget(event.target)) return;
		if (phase !== 'revealing' && phase !== 'complete') return;
		event.preventDefault();
		advance();
	}

	onMount(() => {
		quickOpening = localStorage.getItem(quickPreferenceKey) === 'true';
		preferenceReady = true;
		const media = window.matchMedia('(max-width: 1023px)');
		const updateViewport = () => (mobileViewport = media.matches);
		updateViewport();
		media.addEventListener('change', updateViewport);
		return () => media.removeEventListener('change', updateViewport);
	});

	onDestroy(clearTimers);

	$effect(() => {
		if (preferenceReady) localStorage.setItem(quickPreferenceKey, String(quickOpening));
	});

	function resumeAfterSuspension() {
		const nextIndex = slots.findIndex((slot) => !slot.revealed);
		mobileIndex = nextIndex >= 0 ? nextIndex : Math.max(0, slots.length - 1);
		if (nextIndex < 0 && phase === 'revealing' && !awaitingMobileSummary) {
			phase = 'complete';
			return;
		}
		if (!quickOpening && phase === 'dealing') {
			phase = 'revealing';
			return;
		}
		if (!quickOpening || nextIndex < 0 || (phase !== 'dealing' && phase !== 'revealing')) return;
		slots = slots.map((slot) => ({ ...slot, revealed: true }));
		mobileIndex = 0;
		phase = 'complete';
	}

	$effect(() => {
		if (suspended === suspensionActive) return;
		suspensionActive = suspended;
		untrack(() => {
			if (suspended) clearTimers();
			else resumeAfterSuspension();
		});
	});

	$effect(() => {
		if (!mobileSceneActive) return;
		const bodyOverflow = document.body.style.overflow;
		const htmlOverflow = document.documentElement.style.overflow;
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = bodyOverflow;
			document.documentElement.style.overflow = htmlOverflow;
		};
	});

	$effect(() => {
		if (cards?.length) {
			if (openingId !== handledOpeningId) startDeal(cards, openingId);
			return;
		}
		if (opening) phase = 'opening';
		else if (error) {
			openRequested = false;
			phase = 'error';
		} else if (!cards && phase !== 'dealing') phase = 'idle';
	});

	function resetStage() {
		clearTimers();
		slots = [];
		phase = 'idle';
		openRequested = false;
		onReset();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<ForgePanel
	class={cn(
		'booster-stage relative isolate flex min-h-[38rem] flex-col overflow-hidden p-4 sm:p-6 lg:min-h-[45rem] lg:p-8',
		mobileSceneActive && 'booster-mobile-fullscreen'
	)}
>
	<div class="booster-stage-energy" aria-hidden="true"></div>
	<div
		class="relative z-20 flex flex-wrap items-start justify-between gap-3"
		data-booster-interactive
	>
		<div class="flex flex-wrap gap-2">
			<HudStat label={$_('boosters.reserve')} value={`${available} / ${maximum}`} accent />
			{#if nextDelay}<HudStat label={$_('boosters.nextCharge')} value={nextDelay} />{/if}
		</div>
		<label class="booster-quick-toggle" data-booster-interactive>
			<span>
				<strong>{$_('boosters.quick_mode')}</strong>
				<small>{$_('boosters.quick_mode_hint')}</small>
			</span>
			<Switch bind:checked={quickOpening} aria-label={$_('boosters.quick_mode')} />
		</label>
	</div>

	<div
		class="booster-stage-content relative z-10"
		data-phase={phase}
		onclick={handleStageClick}
		role="presentation"
	>
		{#if phase === 'idle' || phase === 'opening' || phase === 'error'}
			<div class="mx-auto flex max-w-xl flex-col items-center py-6 text-center sm:py-10">
				<p class="forge-label">
					{phase === 'opening'
						? $_('boosters.opening')
						: phase === 'error'
							? $_('boosters.opening_error')
							: $_('boosters.chamberReady')}
				</p>
				<h2 class="mt-3 text-3xl font-bold sm:text-4xl">{packName}</h2>
				<button
					class="forge-energy-orbit mt-4 flex w-56 cursor-pointer flex-col items-center border-0 bg-transparent p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 sm:w-72"
					disabled={!available || opening}
					onclick={(event) => {
						event.stopPropagation();
						requestOpen();
					}}
					aria-label={phase === 'error'
						? $_('boosters.retry')
						: opening
							? $_('boosters.opening')
							: $_('boosters.open')}
					data-booster-interactive
				>
					<img
						src={packImage}
						alt=""
						class="w-full drop-shadow-[0_0_2rem_rgb(253_121_12_/_38%)]"
						class:forge-booster-idle={phase === 'idle'}
						class:booster-pack-opening={phase === 'opening'}
					/>
					<span class="booster-open-label">
						{phase === 'error'
							? $_('boosters.retry')
							: opening
								? $_('boosters.opening')
								: $_('boosters.open')}
					</span>
				</button>
				{#if !available}<p class="mt-4 text-sm text-muted-foreground">
						{$_('boosters.emptyReserve')}
					</p>{/if}
			</div>
		{:else}
			<div class="flex min-h-0 flex-1 flex-col items-center justify-center py-4">
				<p class="forge-label text-center">
					{phase === 'complete' ? $_('boosters.complete') : $_('boosters.reveal_instruction')}
				</p>
				<div
					bind:this={deckElement}
					class="booster-deck mt-5"
					data-phase={phase}
					aria-label={$_('boosters.revealed_title')}
					use:emblaCarouselSvelte={{ options: boosterCarouselOptions, plugins: [] }}
					onemblaInit={handleCarouselInit}
				>
					{#each slots as slot, index (slot.card.id)}
						<div
							class="booster-slot"
							class:mobile-current={index === mobileIndex}
							data-slot-index={index}
							style={`--slot-index:${index};--slot-offset:${index - (slots.length - 1) / 2};--slot-arc:${Math.abs(index - (slots.length - 1) / 2) * 0.75}rem`}
						>
							<BoosterRevealCard
								card={slot.card}
								revealed={slot.revealed}
								interactive={phase === 'revealing' && !suspended}
								detailsEnabled={!suspended}
								onReveal={() => setSlotRevealed(index)}
								onOpenDetail={() => onOpenCard(slot.card)}
							/>
						</div>
					{/each}
				</div>
				{#if phase === 'complete' && mobileViewport && slots.length > 1}
					<div class="booster-mobile-navigation" data-booster-interactive>
						<Button
							variant="outline"
							size="sm"
							disabled={mobileIndex === 0}
							onclick={() => showMobileCard(mobileIndex - 1)}
						>
							{$_('boosters.previous')}
						</Button>
						<p class="forge-label">
							{$_('boosters.reveal_progress', {
								values: { current: mobileIndex + 1, total: slots.length }
							})}
						</p>
						<Button
							variant="outline"
							size="sm"
							disabled={mobileIndex === slots.length - 1}
							onclick={() => showMobileCard(mobileIndex + 1)}
						>
							{$_('boosters.next')}
						</Button>
					</div>
				{/if}
				<div
					class="mt-5 flex min-h-11 flex-wrap items-center justify-center gap-2"
					data-booster-interactive
				>
					{#if phase === 'complete'}
						<Button variant="outline" onclick={resetStage}>{$_('boosters.close')}</Button>
						{#if available}<Button onclick={requestOpen}>{$_('boosters.open_next')}</Button>{/if}
					{:else if awaitingMobileSummary}
						<Button onclick={advance}>{$_('boosters.show_summary')}</Button>
					{:else}
						<p class="text-center text-xs text-muted-foreground sm:text-sm">
							{$_('boosters.advance_instruction')}
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</ForgePanel>

<style>
	.booster-stage-energy {
		position: absolute;
		inset: 1px;
		background:
			radial-gradient(circle at 50% 58%, rgb(25 167 170 / 24%), transparent 24rem),
			conic-gradient(
				from 45deg at 50% 55%,
				transparent 0 12%,
				rgb(254 184 35 / 8%) 12.5% 13%,
				transparent 13.5% 37%
			);
		animation: booster-stage-rotation 24s linear infinite;
	}

	.booster-stage-content {
		display: flex;
		min-height: 31rem;
		min-width: 0;
		flex: 1;
		flex-direction: column;
	}

	.booster-mobile-navigation {
		display: flex;
		width: min(100%, 28rem);
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.booster-quick-toggle {
		display: flex;
		min-height: 44px;
		align-items: center;
		gap: 0.75rem;
		border: 1px solid color-mix(in srgb, var(--primary) 32%, transparent);
		background: rgb(8 15 25 / 82%);
		padding: 0.45rem 0.65rem;
		cursor: pointer;
	}

	.booster-quick-toggle span {
		display: grid;
		gap: 0.1rem;
	}
	.booster-quick-toggle strong {
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		color: var(--primary);
		text-transform: uppercase;
	}
	.booster-quick-toggle small {
		font-size: 0.68rem;
		color: var(--muted-foreground);
	}

	.booster-open-label {
		margin-top: 0.75rem;
		border: 1px solid var(--accent);
		background: linear-gradient(to bottom, var(--primary), var(--accent));
		padding: 0.75rem 1.5rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--primary-foreground);
		text-transform: uppercase;
	}

	.booster-pack-opening {
		animation: booster-pack-opening 780ms ease-in-out infinite alternate;
	}

	.booster-deck {
		display: flex;
		width: 100%;
		min-height: 20rem;
		align-items: center;
		justify-content: center;
		padding: 1.25rem 0;
	}

	.booster-slot {
		position: relative;
		flex: 0 0 auto;
		margin-inline: -1rem;
		transform: translateY(var(--slot-arc)) rotate(calc(var(--slot-offset) * 3deg));
		animation: booster-card-deal 620ms cubic-bezier(0.16, 0.82, 0.25, 1.12) both;
		animation-delay: calc(var(--slot-index) * 90ms);
	}

	@keyframes booster-card-deal {
		from {
			transform: translateY(9rem) scale(0.5) rotate(0);
			opacity: 0;
		}
	}

	@keyframes booster-pack-opening {
		from {
			transform: scale(0.96) rotate(-1deg);
			filter: brightness(1);
		}
		to {
			transform: scale(1.04) rotate(1deg);
			filter: brightness(1.45);
		}
	}

	@keyframes booster-stage-rotation {
		to {
			transform: rotate(360deg) scale(1.2);
		}
	}

	@media (min-width: 1024px) {
		.booster-slot :global(.booster-reveal-card) {
			width: 10rem;
		}
		.booster-slot :global(.booster-reveal-card.is-landscape) {
			width: 14rem;
		}
	}

	@media (max-width: 1023px) {
		:global(.booster-mobile-fullscreen) {
			position: fixed;
			inset: 0;
			z-index: 80;
			height: 100dvh;
			min-height: 0;
			max-width: 100vw;
			padding: max(0.75rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
				max(0.75rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
			overflow: hidden;
			clip-path: none;
		}
		.booster-stage-content {
			min-height: 0;
			overflow: hidden;
		}
		.booster-deck {
			min-width: 0;
			min-height: 0;
			max-width: 100%;
			flex: 1;
			overflow-x: auto;
			overflow-y: hidden;
			justify-content: flex-start;
			overscroll-behavior-x: contain;
			scrollbar-width: none;
			scroll-snap-type: x mandatory;
			touch-action: pan-x;
		}
		.booster-deck::-webkit-scrollbar {
			display: none;
		}
		.booster-deck:not([data-phase='complete']) {
			justify-content: center;
			overflow: visible;
		}
		.booster-deck:not([data-phase='complete']) .booster-slot:not(.mobile-current) {
			display: none;
		}
		.booster-deck[data-phase='complete'] {
			gap: 0.8rem;
			padding-inline: max(0px, calc(50% - min(29vw, 6.5rem)));
		}
		.booster-slot {
			margin-inline: 0;
			transform: none;
			scroll-snap-align: center;
		}
		.booster-slot :global(.booster-reveal-card) {
			width: min(58vw, 13rem, calc((100dvh - 15rem) * 0.706));
		}
		.booster-slot :global(.booster-reveal-card.is-landscape) {
			width: min(86vw, 19rem, calc((100dvh - 15rem) * 1.416));
		}
		:global(.booster-mobile-fullscreen) .booster-stage-energy {
			inset: 0;
		}
		:global(.booster-mobile-fullscreen) .booster-quick-toggle small {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.booster-stage-energy,
		.booster-pack-opening,
		.booster-slot {
			animation: none;
		}
	}
</style>
