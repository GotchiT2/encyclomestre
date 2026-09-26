<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import PackArt from './pack-art.svelte';
	import VariantCard from './variant-card.svelte';
	import {
		packs,
		stockFor,
		unavailableReason,
		previewCard,
		type PreviewPack,
		type PreviewSession
	} from './catalogue';
	let {
		session,
		now,
		busy,
		onDetail,
		onOpen
	}: {
		session: PreviewSession;
		now: number;
		busy: boolean;
		onDetail: (pack: PreviewPack) => void;
		onOpen: (pack: PreviewPack) => void;
	} = $props();
	const active = $derived(
		packs.filter((pack) => pack.kind !== 'theme' || stockFor(pack, session) > 0)
	);
	const exhausted = $derived(
		packs.filter((pack) => pack.kind === 'theme' && stockFor(pack, session) === 0)
	);
</script>

<section id="pack-catalogue" class="scroll-mt-8">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-2">
		<div>
			<p class="forge-label">{$_('boosterPreview.catalogue_eyebrow')}</p>
			<h2 class="mt-2 font-serif text-3xl">{$_('boosterPreview.catalogue_title')}</h2>
		</div>
		<p class="text-sm text-muted-foreground">{$_('boosterPreview.pack_types')}</p>
	</div>
	<div class="catalogue-grid">
		{#each active as pack (pack.id)}
			{@const reason = unavailableReason(pack, session, now)}
			<article class="pack-tile" style={`--pack-color:${pack.color}`} data-pack={pack.id}>
				<div class="pack-top">
					<span>{$_(`boosterPreview.tiers.${pack.kind}`)}</span><span
						class="status-dot"
						class:unavailable={Boolean(reason)}
					></span><span
						>{reason ? $_(`boosterPreview.status.${reason}`) : $_('boosterPreview.available')}</span
					>
				</div>
				<div class="pack-display">
					<span class="orbit" aria-hidden="true"></span><span class="pack-object"
						><PackArt {pack} /></span
					><span class="sample-card"
						><VariantCard
							card={previewCard(pack, pack.variantIds[pack.kind === 'daily' ? 0 : 1])}
							decorative
						/></span
					>
					<button
						class="pack-hit"
						onclick={() => onDetail(pack)}
						aria-label={$_('boosterPreview.detail_label', {
							values: { pack: $_(`boosterPreview.packs.${pack.nameKey}`) }
						})}
					></button>
				</div>
				<div class="pack-copy">
					<p class="edition">{pack.edition}</p>
					<h3>{$_(`boosterPreview.packs.${pack.nameKey}`)}</h3>
					<p class="description">{$_(`boosterPreview.descriptions.${pack.descriptionKey}`)}</p>
					<div class="stock-line">
						{#if pack.kind === 'daily'}<span>{$_('boosterPreview.free_daily')}</span>{:else}<span
								>{$_('boosterPreview.remaining_count', {
									values: { count: stockFor(pack, session) }
								})}</span
							>{/if}<span>{$_('boosterPreview.five_cards')}</span>
					</div>
					{#if reason === 'daily_wait'}<p class="mb-3 text-xs text-muted-foreground">
							{$_('boosterPreview.next_daily', {
								values: {
									date: new Date(session.dailyAvailableAt).toLocaleString('fr-FR', {
										day: 'numeric',
										month: 'short',
										hour: '2-digit',
										minute: '2-digit'
									})
								}
							})}
						</p>{/if}
					<div class="flex flex-wrap gap-2">
						<Button class="flex-1 px-3" variant="outline" onclick={() => onDetail(pack)}
							>{$_('boosterPreview.details')}</Button
						><Button
							class="flex-1 px-3"
							disabled={busy || Boolean(reason)}
							onclick={() => onOpen(pack)}>{$_('boosterPreview.open')}</Button
						>
					</div>
				</div>
			</article>
		{/each}
	</div>
	{#if exhausted.length}
		<div class="mt-8 border border-border bg-card/40 p-5">
			<h3 class="mb-4 font-title text-lg">{$_('boosterPreview.exhausted_title')}</h3>
			<div class="flex flex-wrap gap-3">
				{#each exhausted as pack (pack.id)}<Button variant="outline" onclick={() => onDetail(pack)}
						>{$_(`boosterPreview.packs.${pack.nameKey}`)} · {$_(
							'boosterPreview.status.exhausted'
						)}</Button
					>{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.catalogue-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 24px;
	}
	.pack-tile {
		min-width: 0;
		overflow: hidden;
		border: 1px solid #809fce30;
		background: linear-gradient(150deg, #112244, #0a1730 80%);
		transition: border-color 0.2s;
	}
	.pack-tile:hover {
		border-color: color-mix(in srgb, var(--pack-color) 60%, transparent);
	}
	.pack-top {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 17px 20px 0;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #c0cede;
	}
	.pack-top > span:first-child {
		margin-right: auto;
		color: var(--pack-color);
	}
	.status-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #9cdfbc;
	}
	.status-dot.unavailable {
		background: #d8ab75;
	}
	.pack-display {
		display: block;
		position: relative;
		width: 100%;
		height: 275px;
		overflow: hidden;
		cursor: pointer;
		background: radial-gradient(
			ellipse at 50% 70%,
			color-mix(in srgb, var(--pack-color) 14%, transparent),
			transparent 67%
		);
	}
	.pack-hit {
		position: absolute;
		inset: 0;
		z-index: 3;
		cursor: pointer;
	}
	.pack-hit:focus-visible {
		outline: 2px solid var(--energy-soft);
		outline-offset: -5px;
	}
	.pack-object {
		position: absolute;
		width: 138px;
		left: calc(50% - 95px);
		top: 24px;
		transform: rotate(-8deg);
		transition: transform 0.3s;
		z-index: 2;
	}
	.sample-card {
		position: absolute;
		width: 112px;
		left: calc(50% + 10px);
		top: 76px;
		transform: rotate(12deg);
		pointer-events: none;
	}
	.pack-display:hover .pack-object {
		transform: rotate(-4deg) translateY(-5px);
	}
	.orbit {
		position: absolute;
		left: 15%;
		right: 15%;
		bottom: 9px;
		height: 45px;
		border: 1px solid color-mix(in srgb, var(--pack-color) 20%, transparent);
		border-radius: 50%;
	}
	.pack-copy {
		padding: 6px 22px 22px;
	}
	.edition {
		font-size: 10px;
		letter-spacing: 0.18em;
		color: var(--pack-color);
	}
	h3 {
		margin-top: 5px;
		font: 700 28px / 1.15 var(--font-serif);
	}
	.description {
		min-height: 44px;
		margin-top: 10px;
		font-size: 14px;
		line-height: 1.45;
		color: #aebbd0;
	}
	.stock-line {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 5px;
		margin-block: 20px 16px;
		border-top: 1px solid #8399bc25;
		padding-top: 14px;
		font-size: 12px;
		color: #ced7e5;
	}
	@media (max-width: 1050px) {
		.catalogue-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 620px) {
		.catalogue-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.pack-display {
			height: 280px;
		}
		.pack-object {
			width: 145px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pack-object,
		.pack-tile {
			transition: none;
		}
		.pack-display:hover .pack-object {
			transform: rotate(-8deg);
		}
	}
</style>
