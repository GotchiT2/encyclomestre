<script lang="ts">
	import { _ } from '$lib/i18n';
	import Brand from '$lib/brand/brand.svelte';
	import type { PreviewPack } from './catalogue';
	let { pack }: { pack: PreviewPack } = $props();
</script>

<div
	class="pack-art"
	data-theme={pack.renderKey}
	data-testid="pack-art"
	style={`--pack-metal:${pack.color}`}
	aria-hidden="true"
>
	<div class="pack-texture"></div>
	<div class="outer-frame"></div>
	<div class="inner-frame"></div>
	<p class="pack-name">{$_(`boosterPreview.packs.${pack.nameKey}`)}</p>
	<p class="pack-brand"><Brand kind="wordmark" /></p>
	<p class="pack-motto">{$_('boosterPreview.pack_motto')}</p>
	<div class="pack-rule"><span></span><i></i><span></span></div>
	<div class="pack-seal"><Brand kind="symbol" /></div>
	<div class="pack-footer">
		<div class="footer-side"><strong>5</strong><span>{$_('boosterPreview.cards_label')}</span></div>
		<div class="footer-center">
			<span>{$_(`boosterPreview.tiers.${pack.kind}`)}</span><strong
				>{$_(`boosterPreview.packs.${pack.nameKey}`)}</strong
			>
		</div>
		<div class="footer-side"><strong>5</strong><span>{$_('boosterPreview.cards_label')}</span></div>
	</div>
</div>

<style>
	.pack-art {
		container-type: inline-size;
		position: relative;
		width: 100%;
		aspect-ratio: 862 / 1221;
		overflow: hidden;
		color: #f6e6b8;
		background:
			radial-gradient(
				circle at 53% 46%,
				color-mix(in srgb, var(--pack-metal) 20%, transparent),
				transparent 18%
			),
			radial-gradient(ellipse at 50% 55%, #153f55, #071629 63%, #030913);
		border: 1px solid color-mix(in srgb, var(--pack-metal) 72%, #fd790c);
		box-shadow:
			8px 16px 25px rgb(0 0 0 / 58%),
			inset 2px 0 5px rgb(255 255 255 / 10%);
		clip-path: polygon(
			0 0,
			100% 0,
			98.5% 4%,
			100% 8%,
			98.5% 92%,
			100% 96%,
			100% 100%,
			0 100%,
			1.5% 96%,
			0 92%,
			1.5% 8%,
			0 4%
		);
		isolation: isolate;
	}
	.pack-art::before,
	.pack-art::after {
		position: absolute;
		z-index: 8;
		right: 0;
		left: 0;
		height: 3.4%;
		content: '';
		background:
			repeating-linear-gradient(90deg, #0004 0 2px, #fff1 2px 3px),
			linear-gradient(#06101d, color-mix(in srgb, var(--pack-metal) 45%, #a8440a), #06101d);
	}
	.pack-art::before {
		top: 0;
	}
	.pack-art::after {
		bottom: 0;
		transform: rotate(180deg);
	}
	.outer-frame,
	.inner-frame {
		position: absolute;
		z-index: 4;
		pointer-events: none;
		border: 1px solid color-mix(in srgb, var(--pack-metal) 84%, #ff861c);
	}
	.outer-frame {
		inset: 5% 3%;
	}
	.inner-frame {
		inset: 7% 5.5%;
		opacity: 0.72;
	}
	.pack-texture {
		position: absolute;
		inset: 0;
		background:
			repeating-conic-gradient(
				from 0deg at 50% 47%,
				transparent 0 2deg,
				color-mix(in srgb, var(--pack-metal) 6%, transparent) 2.2deg 2.5deg
			),
			radial-gradient(
				circle at 50% 47%,
				transparent 0 16%,
				rgb(255 255 255 / 4%) 17%,
				transparent 20%
			);
		mask-image: linear-gradient(transparent 9%, #000 25%, #000 76%, transparent 94%);
	}
	.pack-name {
		position: absolute;
		z-index: 5;
		top: 5.2%;
		right: 13%;
		left: 13%;
		font: 700 7.2cqw / 1 var(--font-title);
		letter-spacing: 0.08em;
		color: var(--pack-metal);
		text-align: center;
		text-transform: uppercase;
	}
	.pack-brand {
		position: absolute;
		z-index: 5;
		top: 24%;
		right: 6%;
		left: 6%;
		font: 700 18cqw / 0.9 var(--font-heading);
		letter-spacing: 0.035em;
		color: #fff3d7;
		text-align: center;
		text-transform: uppercase;
		text-shadow:
			0 3px 0 #6f2607,
			0 0 18px color-mix(in srgb, var(--pack-metal) 32%, transparent);
	}
	.pack-motto {
		position: absolute;
		z-index: 5;
		top: 41%;
		right: 8%;
		left: 8%;
		font: 700 5.2cqw / 1.2 var(--font-serif);
		color: #f5dca1;
		text-align: center;
	}
	.pack-rule {
		position: absolute;
		z-index: 5;
		top: 49.5%;
		right: 18%;
		left: 18%;
		display: flex;
		align-items: center;
		gap: 4%;
	}
	.pack-rule span {
		height: 1px;
		flex: 1;
		background: var(--pack-metal);
	}
	.pack-rule i {
		width: 7%;
		aspect-ratio: 1;
		border: 1px solid var(--pack-metal);
		transform: rotate(45deg);
	}
	.pack-seal {
		position: absolute;
		z-index: 5;
		top: 57%;
		left: 50%;
		width: 25%;
		aspect-ratio: 1;
		padding: 5%;
		color: var(--pack-metal);
		background: radial-gradient(circle, #16384d, #07101d 68%);
		border: 1px solid var(--pack-metal);
		box-shadow:
			inset 0 0 0 3px #050b14,
			0 0 25px color-mix(in srgb, var(--pack-metal) 24%, transparent);
		transform: translateX(-50%) rotate(45deg);
	}
	.pack-seal :global(svg) {
		transform: rotate(-45deg);
	}
	.pack-footer {
		position: absolute;
		z-index: 5;
		right: 7%;
		bottom: 6.4%;
		left: 7%;
		display: grid;
		grid-template-columns: 0.7fr 1.35fr 0.7fr;
		gap: 2%;
		align-items: stretch;
	}
	.pack-footer > div {
		display: flex;
		min-width: 0;
		min-height: 12cqw;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 5%;
		background: rgb(4 13 27 / 82%);
		border: 1px solid var(--pack-metal);
		clip-path: polygon(8% 0, 92% 0, 100% 18%, 100% 82%, 92% 100%, 8% 100%, 0 82%, 0 18%);
		text-align: center;
	}
	.footer-side strong {
		font: 700 7cqw / 1 var(--font-heading);
		color: var(--pack-metal);
	}
	.footer-side span,
	.footer-center span {
		font: 700 2.7cqw / 1.1 var(--font-title);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	.footer-center strong {
		margin-top: 3%;
		font: 700 5.5cqw / 1 var(--font-serif);
		color: var(--pack-metal);
		text-transform: uppercase;
	}
	[data-theme='chrome'] {
		background:
			radial-gradient(circle at 53% 46%, #d8f4ff33, transparent 18%),
			linear-gradient(145deg, #24394c, #07111d 55%, #334557);
	}
	[data-theme='chrome'] .pack-texture {
		background:
			linear-gradient(
				112deg,
				transparent 17%,
				#d7f5ff22 25%,
				transparent 29%,
				transparent 58%,
				#ffe7ad20 65%,
				transparent 70%
			),
			repeating-conic-gradient(from 0deg at 50% 47%, transparent 0 2deg, #dff9ff0d 2.2deg 2.5deg);
	}
	[data-theme='nebula'] {
		background:
			radial-gradient(ellipse at 30% 54%, #58338b66, transparent 43%),
			linear-gradient(145deg, #151a3b, #050a19 68%);
	}
	[data-theme='nebula'] .pack-texture {
		background:
			radial-gradient(#eadfff 0 1px, transparent 1.4px) 0 0 / 28px 37px,
			repeating-conic-gradient(from 0deg at 50% 47%, transparent 0 3deg, #bca8ff0d 3.2deg 3.5deg);
	}
	[data-theme='arcade'] {
		background:
			repeating-linear-gradient(0deg, transparent 0 3px, #0003 3px 4px),
			linear-gradient(145deg, #123c3b, #06111d 70%);
	}
	[data-theme='arcade'] .inner-frame {
		border-width: 2px;
		clip-path: polygon(
			0 0,
			38% 0,
			38% 2%,
			98% 2%,
			98% 38%,
			100% 38%,
			100% 100%,
			62% 100%,
			62% 98%,
			2% 98%,
			2% 62%,
			0 62%
		);
	}
	[data-theme='neon'] {
		background:
			radial-gradient(ellipse at 35% 52%, #c8328b42, transparent 38%),
			linear-gradient(145deg, #24102c, #050815 55%, #08303a);
	}
	[data-theme='neon'] .inner-frame {
		border-color: #f16db8;
		box-shadow:
			inset 0 0 15px #f16db83d,
			0 0 10px #63e5ef35;
	}
	[data-theme='comics'] {
		background:
			radial-gradient(#ff907527 1px, transparent 1.2px) 0 0 / 5px 5px,
			linear-gradient(145deg, #45251f, #090b17 66%);
	}
</style>
