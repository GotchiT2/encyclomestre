<script lang="ts">
	import { untrack, onDestroy } from 'svelte';
	import { defaultLayout } from './layout';
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
	data-title={data.fullArt ? 'overlay' : 'bottom'}
	style={`--card-accent:${visual.color};--card-cut:${Math.max(2, Math.min(5, visual.radius || 3))}cqw;--card-position:${visual.x}% ${visual.y}%;--card-title-size:${visual.fontSize}cqw;--card-align:${visual.align};--card-lines:${Math.min(3, visual.lines)};--card-shine:${active ? pointer + '%' : 'var(--card-pointer,50%)'}`}
	onpointermove={move}
	onpointerleave={() => {
		active = false;
		pointer = 50;
	}}
	role="presentation"
>
	<div class="edge" data-card-zone="frame">
		<div class="face">
			<span class="press-mark" aria-hidden="true">WF</span>
			<div class="folio" data-card-zone="serial">
				<span class="variant">{data.variantName}</span>
				{#if serial}<span class="serial" data-testid="card-serial">{serial}</span>{/if}
			</div>
			<div
				class="picture"
				aria-busy={Boolean(data.image) && !failed && natural.width === 0}
				data-card-zone="image"
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
			<div class="decoration" data-card-zone="decor">
				<Finish finish={decorFinish} {pointer} />
			</div>
			<div class="caption" data-card-zone="title">
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
		aspect-ratio: 1/1.416;
		isolation: isolate;
		color: #171918;
		filter: drop-shadow(0 3px 2px #0005);
	}
	.edge {
		position: absolute;
		inset: 0;
		padding: 1.1cqw;
		background: var(--card-accent);
		clip-path: polygon(0 0, 96% 0, 100% 3%, 100% 100%, 4% 100%, 0 97%);
	}
	.face {
		height: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #efebd9 !important;
		padding: 4cqw;
		gap: 2cqw;
		clip-path: polygon(0 0, 96% 0, 100% 3%, 100% 100%, 4% 100%, 0 97%);
	}
	.face::before {
		content: '';
		position: absolute;
		inset: 2cqw;
		border: 1px solid #17191866;
		pointer-events: none;
		z-index: 5;
	}
	.press-mark {
		position: absolute;
		z-index: 6;
		left: 5cqw;
		top: 5cqw;
		display: grid;
		place-items: center;
		width: 12cqw;
		height: 10cqw;
		background: var(--card-accent);
		color: #171918;
		font:
			900 7cqw/1 'Barlow Condensed',
			sans-serif;
		clip-path: polygon(0 0, 100% 0, 100% 75%, 80% 100%, 0 100%);
	}
	.folio {
		position: absolute;
		bottom: 4cqw;
		left: 5cqw;
		right: 5cqw;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2cqw;
		color: #171918;
		min-height: 7cqw;
		z-index: 6;
		background: transparent !important;
		font:
			700 clamp(9px, 4.2cqw, 18px)/1.1 'Barlow',
			sans-serif;
		border-top: 1px solid #17191844;
		padding-top: 2cqw;
	}
	.variant {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		letter-spacing: 0.02em;
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
		margin-bottom: 33cqw;
		border: 1px solid #171918;
	}
	.picture::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		box-shadow: inset 0 0 0 1.1cqw #17191822;
	}
	.picture img {
		position: relative;
		width: 100%;
		height: 100%;
		display: block;
		object-position: var(--card-position);
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
		position: absolute;
		z-index: 5;
		left: 5cqw;
		right: 5cqw;
		bottom: 14cqw;
		background: #efebd9 !important;
		color: #171918 !important;
		padding: 0 0 1cqw;
		border: 0;
	}
	.title {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: var(--card-lines);
		line-clamp: var(--card-lines);
		overflow: hidden;
		overflow-wrap: anywhere;
		font:
			900 clamp(13px, var(--card-title-size), 40px)/0.96 'Barlow Condensed',
			sans-serif;
		text-align: var(--card-align);
		text-transform: uppercase;
		letter-spacing: -0.025em;
	}
	.edition {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-top: 1.8cqw;
		font:
			600 clamp(9px, 3.6cqw, 15px)/1.1 'Barlow',
			sans-serif;
		opacity: 0.72;
	}
	.decoration {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}
	.logo {
		position: absolute;
		right: 6cqw;
		top: 6cqw;
		width: 12cqw;
		height: 12cqw;
		object-fit: contain;
		z-index: 6;
	}
	.full-art .edge {
		padding: 0.8cqw;
		background: linear-gradient(
			135deg,
			#fffbdc,
			var(--card-accent) 25%,
			#171918 52%,
			var(--card-accent)
		);
	}
	.full-art .face {
		padding: 0;
		background: #171918 !important;
	}
	.full-art .face::before {
		inset: 2cqw;
		border-color: #efebd944;
	}
	.full-art .picture {
		position: absolute;
		inset: 0;
		margin: 0;
		border: 0;
	}
	.full-art .picture::after {
		background: linear-gradient(180deg, #0002, transparent 30%, transparent 45%, #000c 100%);
		box-shadow: none;
	}
	.full-art .press-mark {
		background: #171918cc;
		color: var(--card-accent);
		left: auto;
		right: 5cqw;
		top: 5cqw;
		width: 9cqw;
	}
	.full-art .folio {
		top: 5cqw;
		bottom: auto;
		left: 5cqw;
		right: 17cqw;
		display: block;
		color: #efebd9;
		border: 0;
		padding: 0;
	}
	.full-art .variant {
		display: inline-block;
		max-width: 100%;
		padding: 2cqw 3cqw;
		background: #171918c9;
		border-left: 1.5cqw solid var(--card-accent);
	}
	.full-art .serial {
		position: absolute;
		top: 116cqw;
		right: -12cqw;
		padding: 1cqw 2cqw;
		background: #171918bd;
		border: 1px solid #efebd944;
	}
	.full-art .caption {
		left: 6cqw;
		right: 6cqw;
		bottom: 12cqw;
		background: transparent !important;
		color: #efebd9 !important;
		border: 0;
	}
	.full-art .title {
		font-weight: 900;
		text-shadow: 0 2px 8px #0009;
	}
	.full-art .edition {
		color: #efebd9;
		opacity: 0.9;
		border-top: 1px solid #efebd966;
		padding-top: 2cqw;
		max-width: 80%;
	}
	.chrome .edge {
		background: linear-gradient(
			125deg,
			#f7f5e9 0%,
			var(--card-accent) 20%,
			#6a7375 44%,
			#eff5ed 61%,
			var(--card-accent) 85%,
			#fff 100%
		);
	}
	.chrome .face::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 7;
		pointer-events: none;
		background: linear-gradient(115deg, transparent 25%, #fff2 42%, #fff6 48%, transparent 55%);
		background-size: 250% 100%;
		background-position: var(--card-shine) 0;
		mix-blend-mode: screen;
		opacity: 0.55;
	}
	.chrome:not(.full-art) .face {
		background: linear-gradient(110deg, #d7dcce, #f7f5e9 45%, #aabbb6) !important;
	}
	.chrome:not(.full-art) .caption {
		background: transparent !important;
	}
	.landscape {
		aspect-ratio: 1.416/1;
	}
	.landscape .picture {
		margin-bottom: 23cqw;
	}
	.landscape .title {
		font-size: clamp(13px, calc(var(--card-title-size) * 0.72), 32px);
	}
	.landscape .folio {
		bottom: 3cqw;
		font-size: clamp(9px, 3.4cqw, 16px);
	}
	.landscape .caption {
		bottom: 12cqw;
	}
	.landscape.full-art .picture {
		margin: 0;
	}
	.landscape.full-art .folio {
		top: 4cqw;
		bottom: auto;
	}
	.landscape.full-art .serial {
		top: 52cqw;
	}
	.landscape.full-art .caption {
		bottom: 7cqw;
	}
	@media (prefers-reduced-motion: reduce) {
		.arcade-card {
			transform: none;
		}
	}
</style>
