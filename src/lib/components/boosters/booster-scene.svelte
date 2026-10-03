<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { _ } from '$lib/i18n';
	import { arcadePreferences } from '$lib/arcade/preferences';
	import { cinematicSceneOwner } from '$lib/card-renderer/scene-state';
	import { boosterArtwork, boosterVisual, openingDuration } from './booster-visuals';
	import BoosterPackArt from './booster-pack-art.svelte';
	import type { PackFamily } from '$lib/types';
	import type { createBoosterScene } from './booster-scene-engine';
	import { boosterTextureArtwork } from './booster-texture';
	let {
		name,
		renderKey,
		family,
		count,
		active = true,
		playing = false,
		waiting = false,
		onComplete = () => undefined,
		onProgress = () => undefined
	}: {
		name: string;
		renderKey?: string;
		family?: PackFamily;
		count?: number;
		active?: boolean;
		playing?: boolean;
		waiting?: boolean;
		onComplete?: () => void;
		onProgress?: (progress: number) => void;
	} = $props();
	const owner = Symbol('booster-motion');
	let canvas: HTMLCanvasElement;
	let engine: ReturnType<typeof createBoosterScene> | undefined;
	let mounted = $state(false),
		ready = $state(false),
		failed = $state(false),
		systemReduced = $state(false);
	let progress = $state(0);
	const reduced = $derived(systemReduced || $arcadePreferences.motion === 'reduce');
	const visual = $derived(boosterVisual(renderKey, family));
	const allowed = $derived(
		mounted && active && !reduced && !failed && $cinematicSceneOwner === owner
	);
	onMount(() => {
		mounted = true;
		const media = matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (systemReduced = media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => {
			mounted = false;
			media.removeEventListener('change', sync);
		};
	});
	$effect(() => {
		if (!mounted || !active) return;
		cinematicSceneOwner.set(owner);
		return () => cinematicSceneOwner.update((value) => (value === owner ? null : value));
	});
	$effect(() => {
		if (!allowed) return;
		const artwork = boosterArtwork({
			visual,
			name,
			count,
			brand: $_('navigation.brand'),
			cardsLabel: $_('arcade.cardsLabel')
		});
		const back = boosterArtwork({ visual, back: true, brand: $_('navigation.brand') });
		let alive = true;
		void import('./booster-scene-engine')
			.then(async (module) => {
				await document.fonts.ready;
				try {
					const [printed, reverse] = await Promise.all([
						boosterTextureArtwork(artwork),
						boosterTextureArtwork(back)
					]);
					if (!alive) return;
					engine = module.createBoosterScene(canvas, {
						artwork: printed,
						back: reverse,
						visual,
						onReady: () => {
							if (alive) {
								ready = true;
								engine?.update(progress);
							}
						},
						onFallback: () => {
							if (alive) failed = true;
						}
					});
				} catch {
					if (alive) failed = true;
				}
			})
			.catch(() => {
				if (alive) failed = true;
			});
		return () => {
			alive = false;
			ready = false;
			engine?.dispose();
			engine = undefined;
		};
	});
	$effect(() => {
		if (!playing || !mounted || !active) return;
		let elapsed = 0,
			last = performance.now(),
			frame = 0,
			complete = false;
		untrack(() => (progress = 0));
		const resumeClock = () => (last = performance.now());
		document.addEventListener('visibilitychange', resumeClock);
		function tick(time: number) {
			if (!document.hidden) elapsed += Math.max(0, time - last);
			last = time;
			progress = reduced ? 1 : Math.min(1, elapsed / openingDuration);
			engine?.update(progress);
			onProgress(progress);
			if (progress === 1) {
				if (!complete) {
					complete = true;
					onComplete();
				}
				return;
			}
			frame = requestAnimationFrame(tick);
		}
		frame = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener('visibilitychange', resumeClock);
		};
	});
</script>

<div
	class="booster-scene"
	class:playing
	class:waiting
	class:reduced
	style={`--elapsed:-${progress * openingDuration}ms`}
	data-testid="pack-scene"
	data-renderer={allowed && ready ? 'webgl' : 'dom'}
	data-progress={Math.round(progress * 100)}
	data-visual={visual}
	onpointermove={(event) => {
		if (event.pointerType !== 'mouse' || playing || reduced) return;
		const box = event.currentTarget.getBoundingClientRect();
		engine?.update(
			0,
			(-(event.clientY - box.top - box.height / 2) / box.height) * 0.2,
			((event.clientX - box.left - box.width / 2) / box.width) * 0.45
		);
	}}
	onpointerleave={() => {
		if (!playing) engine?.update(0);
	}}
	role="presentation"
>
	<div class="stage-grid" aria-hidden="true"></div>
	<div class="stage-orbit" aria-hidden="true"></div>
	<canvas bind:this={canvas} class:shown={allowed && ready} aria-hidden="true"></canvas>
	{#if !allowed || !ready}<div class="dom-envelope" aria-hidden="true">
			<div class="dom-shell"><BoosterPackArt {name} {renderKey} {family} cardCount={count} /></div>
			<div class="dom-strip"></div>
		</div>{/if}
	{#if playing && !reduced}<div class="motion-burst" aria-hidden="true">
			<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
				><g fill="none" stroke="#E8EF42"
					><circle cx="400" cy="300" r="100" /><path
						d="M400 0V170M400 430V600M0 300H270M530 300H800M80 0L310 200M490 400L720 600M720 0L490 200M310 400L80 600"
					/></g
				></svg
			>
		</div>
		<div class="motion-streaks" aria-hidden="true">
			{#each Array.from({ length: 12 }, (_, i) => i) as i (i)}<i
					style={`--i:${i};--angle:${i * 30}deg`}
				></i>{/each}
		</div>{/if}
</div>

<style>
	.booster-scene {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		isolation: isolate;
		overflow: hidden;
		background: radial-gradient(ellipse at 50% 60%, #e8ef4210, transparent 60%);
	}
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		z-index: 2;
	}
	canvas.shown {
		opacity: 1;
	}
	.stage-grid {
		position: absolute;
		inset: 55% -15% -40%;
		background:
			linear-gradient(#efebd918 1px, transparent 1px),
			linear-gradient(90deg, #efebd918 1px, transparent 1px);
		background-size: 48px 48px;
		transform: perspective(440px) rotateX(63deg);
		mask-image: radial-gradient(ellipse, black, transparent 68%);
	}
	.stage-orbit {
		position: absolute;
		left: 20%;
		right: 20%;
		bottom: 12%;
		height: 18%;
		border: 1px solid #e8ef4228;
		border-radius: 50%;
		box-shadow: 0 0 24px #e8ef4210;
	}
	.dom-envelope {
		position: absolute;
		height: 67%;
		aspect-ratio: 512/736;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		transform: perspective(800px) rotateY(-8.6deg);
		z-index: 2;
	}
	.dom-strip {
		position: absolute;
		inset: 0 0 auto;
		height: 4%;
		background: repeating-linear-gradient(90deg, #e8ef42 0 1px, #171918 1px 4px);
		transform-origin: right center;
	}
	.playing .dom-shell {
		animation: shell-open 3s cubic-bezier(0.2, 0.65, 0.2, 1) both;
		animation-delay: var(--elapsed);
		animation-play-state: paused;
	}
	.playing .dom-strip {
		animation: strip-tear 3s cubic-bezier(0.2, 0.65, 0.2, 1) both;
		animation-delay: var(--elapsed);
		animation-play-state: paused;
	}
	.playing canvas.shown {
		animation: canvas-exit 3s linear both;
		animation-delay: var(--elapsed);
		animation-play-state: paused;
	}
	.motion-burst {
		position: absolute;
		inset: 0;
		z-index: 1;
		animation: impact 3s ease-out both;
		animation-delay: var(--elapsed);
		animation-play-state: paused;
	}
	.motion-burst svg {
		width: 100%;
		height: 100%;
		stroke-width: 3;
	}
	.motion-streaks {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 3;
	}
	.motion-streaks i {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 5px;
		height: 34px;
		background: #e8ef42;
		transform: rotate(var(--angle));
		animation: fragment 3s cubic-bezier(0.15, 0.65, 0.15, 1) both;
		animation-delay: calc(var(--elapsed) + var(--i) * 5ms);
		animation-play-state: paused;
	}
	.waiting .stage-orbit {
		animation: waiting-pulse 1.4s ease-in-out infinite alternate;
	}
	.reduced .dom-envelope {
		transform: none;
	}
	.reduced .stage-grid {
		transform: none;
		opacity: 0.3;
	}
	.reduced .dom-shell,
	.reduced .dom-strip,
	.reduced canvas,
	.reduced .stage-orbit {
		animation: none;
	}
	@keyframes shell-open {
		0%,
		23% {
			transform: translateY(0) scale(1);
		}
		45% {
			transform: perspective(600px) rotateY(20deg) scale(1.04);
		}
		73% {
			transform: translateY(35px) rotateZ(-9deg);
			opacity: 1;
		}
		100% {
			transform: translateY(150px) scale(0.85);
			opacity: 0;
		}
	}
	@keyframes strip-tear {
		0%,
		23% {
			transform: none;
		}
		50%,
		100% {
			transform: translate(130px, -130px) rotate(-60deg);
			opacity: 0;
		}
	}
	@keyframes canvas-exit {
		0%,
		73% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@keyframes impact {
		0%,
		25% {
			opacity: 0;
			transform: scale(0.25);
		}
		40% {
			opacity: 0.65;
		}
		65%,
		100% {
			opacity: 0;
			transform: scale(1.7);
		}
	}
	@keyframes fragment {
		0%,
		25% {
			opacity: 0;
			transform: rotate(var(--angle)) translateY(-70px) scaleY(0.3);
		}
		35% {
			opacity: 0.85;
		}
		60%,
		100% {
			opacity: 0;
			transform: rotate(var(--angle)) translateY(-280px) scaleY(0.1);
		}
	}
	@keyframes waiting-pulse {
		to {
			opacity: 0.35;
			box-shadow: 0 0 36px #e8ef4222;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		*,
		::before,
		::after {
			animation: none !important;
		}
		.dom-envelope,
		.stage-grid {
			transform: none;
		}
	}
</style>
