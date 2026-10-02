<script lang="ts">
	import { untrack, onDestroy } from 'svelte';
	import { defaultLayout, surfaceCss } from './layout';
	import { landscapeFor, type TemplateDefinition, type RenderData } from './definition';
	import Finish from './finish.svelte';

	let {
		definition,
		data,
		labels,
		onOrientationChange = () => {},
		testId = 'template-card',
		reveal = false
	}: {
		definition: TemplateDefinition;
		data: RenderData;
		labels: { missing: string; untitled: string };
		onOrientationChange?: (landscape: boolean) => void;
		testId?: string;
		reveal?: boolean;
	} = $props();
	const visual = $derived(definition.visual);
	const design = $derived(definition.design);
	const layout = $derived(definition.layout ?? defaultLayout(design.theme));
	let failed = $state(false),
		active = $state(false),
		pointer = $state(50);
	let inspectedImage: string | null = null;
	let alive = true;
	onDestroy(() => {
		alive = false;
	});
	let natural = $state({ width: 0, height: 0 });
	const landscape = $derived(
		landscapeFor(design.orientation, data.fullArt, natural.width, natural.height)
	);
	const serial = $derived(
		data.serial == null
			? ''
			: data.maximum == null
				? `#${data.serial}`
				: `${data.serial}/${data.maximum}`
	);
	const motion = $derived(active || reveal);
	const frameFinish = $derived({
		...layout.frameFinish,
		motion: motion ? layout.frameFinish.motion : ('static' as const)
	});
	const imageFinish = $derived({
		...layout.imageFinish,
		motion: motion ? layout.imageFinish.motion : ('static' as const)
	});
	const decorFinish = $derived({
		...layout.decorFinish,
		motion: motion ? layout.decorFinish.motion : ('static' as const)
	});
	$effect(() => {
		if (data.image === inspectedImage) return;
		inspectedImage = data.image;
		failed = false;
		natural = { width: 0, height: 0 };
	});
	$effect(() => {
		const value = landscape;
		untrack(() => onOrientationChange(value));
	});
	function move(event: PointerEvent) {
		if (
			event.pointerType !== 'mouse' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
			document.documentElement.dataset.motion === 'reduce'
		)
			return;
		active = true;
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		pointer = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
	}
</script>

<div
	class="arcade-card"
	class:landscape
	class:full-art={data.fullArt}
	class:chrome={visual.model === 'chrome'}
	data-testid={testId}
	data-profile="arcade"
	data-theme={design.theme}
	data-full-art={data.fullArt}
	data-orientation={landscape ? 'landscape' : 'portrait'}
	data-foil={layout.frameFinish.type}
	data-title="bottom"
	style={`--card-accent:${visual.color};--card-cut:${Math.max(2, Math.min(5, visual.radius || 3))}cqw;--card-position:${visual.x}% ${visual.y}%;--card-title-size:${visual.fontSize}cqw;--card-align:${visual.align};--card-lines:${Math.min(3, visual.lines)}`}
	onpointermove={move}
	onpointerleave={() => {
		active = false;
		pointer = 50;
	}}
	role="presentation"
>
	<div class="edge" data-card-zone="frame">
		<div class="face" style={surfaceCss({ ...layout.zones.frame, padding: 0, shadow: 0 })}>
			<div class="folio" data-card-zone="serial" style={surfaceCss(layout.zones.serial)}>
				<span class="variant">{data.variantName}</span>
				{#if serial}<span class="serial" data-testid="card-serial">{serial}</span>{/if}
			</div>
			<div
				class="picture"
				aria-busy={Boolean(data.image) && !failed && natural.width === 0}
				data-card-zone="image"
				style={surfaceCss(layout.zones.image)}
			>
				{#key data.image}
					{@const source = data.image}
					{#if source && !failed}<span class="loading-mark" aria-hidden="true">✦</span><img
							src={source}
							alt=""
							loading="lazy"
							decoding="async"
							class:blurred={data.blurred}
							style={`object-fit:${visual.fit}`}
							onload={(event) => {
								if (alive && source === data.image)
									natural = {
										width: (event.currentTarget as HTMLImageElement).naturalWidth,
										height: (event.currentTarget as HTMLImageElement).naturalHeight
									};
							}}
							onerror={() => {
								if (alive && source === data.image) failed = true;
							}}
						/>
					{:else}<span class="missing">{labels.missing}</span>{/if}
				{/key}
				<Finish finish={imageFinish} {pointer} />
			</div>
			<div class="decoration" data-card-zone="decor" style={surfaceCss(layout.zones.decor)}>
				<Finish finish={decorFinish} {pointer} />
			</div>
			<div class="caption" data-card-zone="title" style={surfaceCss(layout.zones.title)}>
				<strong class="title" title={data.title}>{data.title || labels.untitled}</strong>
				{#if data.edition}<span class="edition">{data.edition}</span>{/if}
			</div>
			{#if data.boosterLogo}<img
					class="logo"
					data-card-zone="logo"
					src={data.boosterLogo}
					alt=""
				/>{/if}
			<Finish finish={frameFinish} frame {pointer} />
		</div>
	</div>
</div>

<style>
	.arcade-card {
		width: 100%;
		container-type: inline-size;
		position: relative;
		aspect-ratio: 1 / 1.416;
		isolation: isolate;
		color: #171918;
	}
	.edge {
		position: absolute;
		inset: 0;
		padding: 1.3cqw;
		background: var(--card-accent);
		clip-path: polygon(
			var(--card-cut) 0,
			calc(100% - var(--card-cut)) 0,
			100% var(--card-cut),
			100% calc(100% - var(--card-cut)),
			calc(100% - var(--card-cut)) 100%,
			var(--card-cut) 100%,
			0 calc(100% - var(--card-cut)),
			0 var(--card-cut)
		);
	}
	.face {
		height: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #171918;
		padding: 2.4cqw;
		gap: 1.8cqw;
		clip-path: polygon(
			2cqw 0,
			calc(100% - 2cqw) 0,
			100% 2cqw,
			100% calc(100% - 2cqw),
			calc(100% - 2cqw) 100%,
			2cqw 100%,
			0 calc(100% - 2cqw),
			0 2cqw
		);
	}
	.folio {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2cqw;
		color: #efebd9;
		min-height: 7.5cqw;
		flex: none;
		position: relative;
		z-index: 3;
		padding-inline: 2cqw;
		background: #171918e8;
		font-family: 'Barlow', sans-serif;
		font-weight: 600;
		font-size: clamp(9px, 4.4cqw, 18px);
	}
	.variant {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		letter-spacing: 0.05em;
	}
	.serial {
		flex: none;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.picture {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		background: #242723;
	}
	.loading-mark {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #efebd933;
		font:
			700 14cqw 'Barlow Condensed',
			sans-serif;
	}
	.picture img {
		position: relative;
		width: 100%;
		height: 100%;
		display: block;
		object-position: var(--card-position);
	}
	.blurred {
		filter: blur(16px);
		transform: scale(1.1);
	}
	.missing {
		height: 100%;
		display: grid;
		place-items: center;
		padding: 10%;
		color: #efebd9;
		font:
			600 clamp(12px, 5cqw, 24px)/1.2 'Barlow',
			sans-serif;
		text-align: center;
	}
	.caption {
		position: relative;
		z-index: 3;
		flex: none;
		background: #efebd9;
		color: #171918;
		padding: 2.3cqw 3cqw;
		border-left: 1.1cqw solid var(--card-accent);
	}
	.title {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: var(--card-lines);
		line-clamp: var(--card-lines);
		overflow: hidden;
		overflow-wrap: anywhere;
		font:
			800 clamp(13px, var(--card-title-size), 40px)/1.02 'Barlow Condensed',
			sans-serif;
		text-align: var(--card-align);
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}
	.edition {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-top: 1.6cqw;
		font:
			500 clamp(9px, 3.7cqw, 15px)/1.1 'Barlow',
			sans-serif;
	}
	.decoration {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}
	.logo {
		position: absolute;
		right: 3cqw;
		top: 12cqw;
		width: 12cqw;
		height: 12cqw;
		object-fit: contain;
		z-index: 4;
	}
	.full-art .picture {
		position: absolute;
		inset: 0;
	}
	.full-art .face {
		justify-content: space-between;
	}
	.full-art .caption {
		margin-top: auto;
	}
	.chrome .edge {
		background: linear-gradient(
			130deg,
			#f7f5e9 0%,
			var(--card-accent) 22%,
			#6a7375 48%,
			#eff5ed 65%,
			var(--card-accent) 100%
		);
	}
	.landscape {
		aspect-ratio: 1.416 / 1;
	}
	.landscape .folio {
		min-height: 5cqw;
		font-size: clamp(9px, 3.4cqw, 16px);
	}
	.landscape .title {
		font-size: clamp(13px, calc(var(--card-title-size) * 0.72), 32px);
	}
	.landscape .caption {
		padding: 1.8cqw 3cqw;
	}
	@media (prefers-reduced-motion: reduce) {
		.arcade-card {
			transform: none;
		}
	}
</style>
