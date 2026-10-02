<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { get } from 'svelte/store';
	import { cinematicSceneOwner } from './scene-state';
	import ArcadePack from './arcade-pack.svelte';
	import type { createPackScene } from './pack-scene-engine';
	let {
		name,
		image,
		color = '#E8EF42',
		brand,
		cardCount = 5,
		cardsLabel,
		playing = false,
		onComplete = () => undefined
	}: {
		name: string;
		image?: string;
		color?: string;
		brand: string;
		cardCount?: number;
		cardsLabel: string;
		playing?: boolean;
		onComplete?: () => void;
	} = $props();
	const owner = Symbol('pack-stage');
	let ceremonyStarted = 0;
	let canvas: HTMLCanvasElement;
	let engine = $state<ReturnType<typeof createPackScene>>(),
		fallback = $state(true);
	let mounted = $state(false),
		reduced = $state(false),
		failed = $state(false);
	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion:reduce)');
		const sync = () =>
			(reduced = media.matches || document.documentElement.dataset.motion === 'reduce');
		sync();
		mounted = true;
		media.addEventListener('change', sync);
		const observer = new MutationObserver(sync);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-motion']
		});
		return () => {
			mounted = false;
			media.removeEventListener('change', sync);
			observer.disconnect();
		};
	});
	$effect(() => {
		if (!playing) return;
		ceremonyStarted = performance.now();
		cinematicSceneOwner.set(owner);
		return () => {
			if (get(cinematicSceneOwner) === owner) cinematicSceneOwner.set(null);
		};
	});
	$effect(() => {
		const allowed =
			mounted && !reduced && !failed && (!$cinematicSceneOwner || $cinematicSceneOwner === owner);
		if (!allowed) {
			fallback = true;
			return;
		}
		const options = { name, image, color, brand, onComplete, onFallback: () => (failed = true) };
		let alive = true,
			scene: ReturnType<typeof createPackScene> | undefined;
		void import('./pack-scene-engine')
			.then((module) => {
				if (!alive) return;
				try {
					scene = module.createPackScene(canvas, options);
					engine = scene;
					fallback = false;
				} catch {
					failed = true;
				}
			})
			.catch(() => {
				if (alive) failed = true;
			});
		return () => {
			alive = false;
			scene?.dispose();
			engine = undefined;
		};
	});
	$effect(() => {
		if (playing && engine) untrack(() => engine?.play());
	});
	$effect(() => {
		if (!playing || !fallback) return;
		const remaining = Math.max(0, 3400 - (performance.now() - ceremonyStarted));
		const timer = setTimeout(onComplete, reduced ? 0 : remaining);
		return () => clearTimeout(timer);
	});
</script>

<div
	class="pack-scene"
	class:playing
	data-testid="pack-scene"
	data-renderer={fallback ? 'dom' : 'webgl'}
	role="presentation"
	onpointermove={(event) => {
		if (event.pointerType !== 'mouse' || fallback) return;
		const r = event.currentTarget.getBoundingClientRect();
		engine?.tilt(
			(event.clientX - r.left) / r.width - 0.5,
			(event.clientY - r.top) / r.height - 0.5
		);
	}}
	onpointerleave={() => engine?.tilt(-0.15, 0)}
>
	<canvas bind:this={canvas} aria-hidden="true" class:hidden={fallback}></canvas>
	{#if fallback}<div class="dom-pack">
			<ArcadePack {name} imageUrl={image} {cardCount} labels={{ brand, cards: cardsLabel }} />
		</div>{/if}
	<div class="stage-ring" aria-hidden="true"></div>
</div>

<style>
	.pack-scene {
		position: relative;
		width: 100%;
		height: clamp(240px, 40dvh, 440px);
		isolation: isolate;
		background: radial-gradient(ellipse at 50% 60%, #e8ef4210, transparent 65%);
	}
	canvas {
		position: relative;
		width: 100%;
		height: 100%;
		display: block;
		z-index: 1;
	}
	canvas.hidden {
		display: none;
	}
	.stage-ring {
		position: absolute;
		bottom: 12%;
		left: 20%;
		right: 20%;
		height: 12%;
		border: 1px solid #efebd924;
		border-radius: 50%;
		transform: rotateX(45deg);
		z-index: -1;
	}
	.dom-pack {
		width: 170px;
		position: absolute;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		filter: drop-shadow(10px 16px 8px #0007);
		transform: perspective(800px) rotateY(-15deg);
	}
	.playing .dom-pack {
		animation: tear-fallback 3400ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	@keyframes tear-fallback {
		0%,
		20% {
			transform: perspective(800px) rotateY(-15deg);
		}
		40% {
			transform: perspective(800px) rotateY(12deg) rotateZ(-6deg) scale(1.04);
		}
		75% {
			transform: perspective(800px) rotateY(-18deg) translateY(-30px);
		}
		100% {
			transform: perspective(800px) rotateY(-25deg) translateY(90px) scale(0.85);
			opacity: 0;
		}
	}
</style>
