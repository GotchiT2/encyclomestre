<script lang="ts">
	import { untrack, onDestroy } from 'svelte';
	import { flame, styleText, type CardBlueprint, type CardLayer } from './blueprint';
	import type { RenderData } from './definition';
	import CardImageFallback from './card-image-fallback.svelte';
	import { hasUsableCardImage } from '$lib/components/cards/card-image-orientation';
	let {
		presentation,
		data,
		labels,
		testId = 'template-card',
		onOrientationChange = () => {},
		reveal = false,
		theme = 'classic'
	}: {
		presentation: CardBlueprint;
		data: RenderData;
		labels: { missing: string; untitled: string };
		testId?: string;
		onOrientationChange?: (value: boolean) => void;
		reveal?: boolean;
		theme?: string;
	} = $props();
	let canvas: HTMLDivElement;
	let failed = $state(false),
		natural = $state({ width: 0, height: 0 }),
		compact = $state(false),
		active = $state(false),
		focused = $state(false),
		reduced = $state(false),
		pointer = $state(50);
	let lastImage = '';
	const landscape = $derived(
		data.fullArt &&
			(presentation.orientation === 'landscape' ||
				(presentation.orientation === 'auto' && natural.width > natural.height))
	);
	const serial = $derived(
		data.serial == null
			? ''
			: data.maximum == null
				? `#${data.serial}`
				: `${data.serial}/${data.maximum}`
	);
	// DOM/animation handles are imperative resources, not render state.
	/* eslint-disable svelte/prefer-svelte-reactivity */
	const animations = new Map<string, Animation>();
	const signatures = new Map<string, string>();
	const nodes = new Map<string, HTMLElement>();
	/* eslint-enable svelte/prefer-svelte-reactivity */
	const text = (layer: CardLayer) =>
		layer.content === 'title'
			? data.title || labels.untitled
			: layer.content === 'description'
				? (data.description ?? '')
				: layer.content === 'collection'
					? (data.edition ?? '')
					: layer.content === 'serial' && data.fullArt
						? serial
						: '';
	function layerStyle(layer: CardLayer) {
		return {
			...layer.style,
			...(landscape ? layer.landscape : {}),
			...(compact ? layer.compact : {})
		};
	}
	function bindLayer(node: HTMLElement, layer: CardLayer) {
		nodes.set(layer.id, node);
		let observer: ResizeObserver | undefined;
		if (layer.content === 'description') {
			const measure = () => {
				const child = node.firstElementChild as HTMLElement;
				if (!child) return;
				const height = parseFloat(getComputedStyle(child).lineHeight);
				const css = getComputedStyle(node),
					available =
						node.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
				const lines = Number.isFinite(height) && height > 0 ? Math.floor(available / height) : 0;
				child.style.setProperty('-webkit-line-clamp', String(Math.max(1, lines)));
				child.style.visibility = lines ? 'visible' : 'hidden';
			};
			observer = new ResizeObserver(measure);
			observer.observe(node);
			document.fonts.ready.then(measure);
		}
		return {
			destroy() {
				observer?.disconnect();
				nodes.delete(layer.id);
				animations.get(layer.id)?.cancel();
				animations.delete(layer.id);
			}
		};
	}
	function observe(node: HTMLDivElement) {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () =>
			(reduced = media.matches || document.documentElement.dataset.motion === 'reduce');
		const settings = new MutationObserver(update);
		settings.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-motion']
		});
		const resize = new ResizeObserver(() => (compact = node.clientWidth < 170));
		resize.observe(node);
		const interactive = node.closest('button,a,[tabindex]') ?? node;
		let disposed = false;
		const focus = () =>
			queueMicrotask(() => {
				if (!disposed)
					focused = node.contains(document.activeElement) || interactive.matches(':focus');
			});
		interactive.addEventListener('focusin', focus);
		interactive.addEventListener('focusout', focus);
		focus();
		media.addEventListener('change', update);
		update();
		return {
			destroy() {
				disposed = true;
				resize.disconnect();
				settings.disconnect();
				media.removeEventListener('change', update);
				interactive.removeEventListener('focusin', focus);
				interactive.removeEventListener('focusout', focus);
			}
		};
	}
	$effect(() => {
		if (data.image !== lastImage) {
			lastImage = data.image;
			failed = false;
			natural = { width: 0, height: 0 };
		}
	});
	$effect(() => {
		const value = landscape;
		untrack(() => onOrientationChange(value));
	});
	$effect(() => {
		const enabled = !reduced && (active || focused || reveal);
		const layers = presentation.layers;
		const position = pointer;
		untrack(() => {
			for (const layer of layers) {
				const m = layer.motion,
					node = nodes.get(layer.id);
				const shouldRun = enabled && m && (m.trigger !== 'reveal' || reveal);
				if (!shouldRun) {
					animations.get(layer.id)?.cancel();
					animations.delete(layer.id);
					signatures.delete(layer.id);
					continue;
				}
				if (!node) continue;
				const signature = JSON.stringify(m);
				if (signatures.get(layer.id) !== signature) {
					animations.get(layer.id)?.cancel();
					animations.delete(layer.id);
					signatures.set(layer.id, signature);
				}
				let animation = animations.get(layer.id);
				if (!animation) {
					try {
						const frames = m.frames.map((style) =>
							Object.fromEntries(
								Object.entries(style).map(([key, value]) => [
									key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()),
									value
								])
							)
						);
						animation = node.animate(frames, {
							duration: m.duration,
							easing: m.easing,
							iterations: m.loop ? Infinity : 1,
							fill: 'both'
						});
						animations.set(layer.id, animation);
					} catch {
						continue;
					}
				}
				if (m.trigger === 'pointer') {
					animation.pause();
					animation.currentTime = (m.duration * position) / 100;
				}
			}
		});
	});
	function move(event: PointerEvent) {
		if (reduced || event.pointerType !== 'mouse') return;
		active = true;
		const rect = canvas.getBoundingClientRect();
		pointer = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
	}
	onDestroy(() => {
		for (const animation of animations.values()) animation.cancel();
	});
</script>

{#snippet children(parent?: string)}
	{#each presentation.layers.filter((layer) => layer.parent === parent) as layer (layer.id)}
		{@const value = text(layer)}
		{#if layer.content !== 'serial' || (data.fullArt && serial)}
			{#if layer.content === 'image'}
				<div
					class="layer image"
					data-card-zone={layer.id}
					data-card-content={layer.content}
					style={styleText(layerStyle(layer))}
					use:bindLayer={layer}
					aria-busy={hasUsableCardImage(data.image) && !failed && !natural.width}
				>
					{#key data.image}{@const source = data.image}{#if hasUsableCardImage(source) && !failed}
							<img
								src={source}
								alt=""
								loading="lazy"
								decoding="async"
								class:blurred={data.blurred}
								style={`object-fit:${layerStyle(layer)['object-fit'] ?? 'cover'};object-position:${layerStyle(layer)['object-position'] ?? '50% 50%'}`}
								onload={(event) => {
									const image = event.currentTarget as HTMLImageElement;
									if (source === data.image)
										natural = { width: image.naturalWidth, height: image.naturalHeight };
								}}
								onerror={() => {
									if (source === data.image) failed = true;
								}}
							/>
						{:else}<CardImageFallback label={labels.missing} />{/if}{/key}
				</div>
			{:else}
				<div
					class="layer"
					class:description={layer.content === 'description'}
					class:title={layer.content === 'title'}
					data-card-zone={layer.id}
					data-card-content={layer.content}
					data-testid={layer.content === 'serial' ? 'card-serial' : undefined}
					style={styleText(layerStyle(layer))}
					use:bindLayer={layer}
					title={['title', 'description', 'collection'].includes(layer.content) ? value : undefined}
				>
					{#if layer.content === 'group'}{@render children(layer.id)}
					{:else if layer.content === 'logo'}<svg
							viewBox="0 0 192 272"
							fill="currentColor"
							aria-hidden="true"><path d={flame} /></svg
						>
					{:else if layer.content === 'description'}<span class="description-text">{value}</span>
					{:else if layer.content !== 'decoration'}{value}{/if}
				</div>
			{/if}
		{/if}
	{/each}
{/snippet}

<div
	class="wf-card"
	bind:this={canvas}
	use:observe
	data-testid={testId}
	data-profile="wikiforge"
	data-theme={theme}
	data-full-art={data.fullArt}
	data-orientation={landscape ? 'landscape' : 'portrait'}
	data-title={data.fullArt ? 'overlay' : 'bottom'}
	style={`aspect-ratio:${landscape ? presentation.landscape : presentation.portrait};--wf-pointer-x:${pointer}%;--wf-pointer-y:50%;`}
	onpointermove={move}
	onpointerleave={() => {
		active = false;
		pointer = 50;
	}}
	role="presentation"
>
	<div
		class="surface"
		style={styleText({
			...presentation.style,
			...(landscape ? presentation.landscapeStyle : {}),
			...(compact ? presentation.compactStyle : {})
		})}
		data-card-zone="frame"
	>
		{@render children()}
	</div>
</div>

<style>
	.wf-card {
		position: relative;
		width: 100%;
		container-type: inline-size;
		isolation: isolate;
		text-align: left;
		overflow: hidden;
	}
	.surface {
		position: absolute;
		inset: 0;
		overflow: hidden;
		box-sizing: border-box;
	}
	.layer {
		position: relative;
		box-sizing: border-box;
		min-width: 0;
		overflow: hidden;
	}
	.layer[data-card-content='decoration'] {
		pointer-events: none;
	}
	.image img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.layer svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	.title,
	.description-text {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.description-text {
		line-height: inherit;
	}
	.blurred {
		filter: blur(16px);
		transform: scale(1.08);
	}
</style>
