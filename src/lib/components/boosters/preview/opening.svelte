<script lang="ts">
	import { _ } from '$lib/i18n';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import Brand from '$lib/brand/brand.svelte';
	import VariantCard from './variant-card.svelte';
	import { isLandscapeCard, type PreviewCard, type PreviewPack } from './catalogue';
	let {
		pack,
		cards,
		onClose,
		onOpenCard,
		missingImage = false
	}: {
		pack: PreviewPack;
		cards: PreviewCard[];
		onClose: () => void;
		onOpenCard: (card: PreviewCard) => void;
		missingImage?: boolean;
	} = $props();
	let revealed = $state(0);
	const complete = $derived(revealed === cards.length);
</script>

<Dialog.Root
	open
	onOpenChange={(open) => {
		if (!open) onClose();
	}}
>
	<Dialog.Content
		class="flex h-[100dvh] max-h-[100dvh] w-screen max-w-6xl flex-col gap-0 border border-solid max-sm:left-0 max-sm:translate-x-0 sm:h-[min(760px,90dvh)] sm:max-h-[90dvh] sm:w-[calc(100%-3rem)] p-0 sm:p-0 overflow-hidden"
	>
		<header class="shrink-0 px-6 pt-8 pr-12 text-center">
			<p class="forge-label">{$_(`boosterPreview.packs.${pack.nameKey}`)}</p>
			<Dialog.Title class="mt-2 font-serif text-3xl"
				>{complete
					? $_('boosterPreview.opening_complete')
					: $_('boosterPreview.opening_title')}</Dialog.Title
			><Dialog.Description class="mt-2"
				>{$_('boosterPreview.opening_description')}</Dialog.Description
			>
		</header>
		<div class="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
			<div class="opening-grid">
				{#each cards as card, index (card.id)}
					{@const landscape = isLandscapeCard(card)}
					<div class="opening-slot" class:landscape class:revealed={index < revealed}>
						{#if index < revealed}<VariantCard {card} onOpen={onOpenCard} {missingImage} />
						{:else}<button
								class="card-back"
								class:landscape
								disabled={index !== revealed}
								onclick={() => (revealed += 1)}
								aria-label={$_('boosterPreview.reveal_one', { values: { index: index + 1 } })}
								><span class="back-frame"
									><span class="back-brand"><Brand kind="wordmark" /></span><span
										class="back-symbol"><Brand kind="symbol" /></span
									><span class="back-number">{String(index + 1).padStart(2, '0')}</span><span
										class="back-action"
										>{index === revealed
											? $_('boosterPreview.reveal')
											: $_('boosterPreview.waiting')}</span
									></span
								></button
							>{/if}
					</div>
				{/each}
			</div>
			<p class="mt-6 text-center text-sm text-muted-foreground" aria-live="polite">
				{$_('boosterPreview.revealed_count', {
					values: { count: revealed, total: cards.length }
				})}{#if complete}<span class="mt-2 block text-primary"
						>{$_('boosterPreview.result_summary', {
							values: { numbered: cards.filter((card) => card.serial).length }
						})}</span
					>{/if}
			</p>
		</div>
		<footer
			class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4"
		>
			<p class="text-xs text-muted-foreground">{$_('boosterPreview.simulation_short')}</p>
			{#if complete}<Button onclick={onClose}>{$_('boosterPreview.back_catalogue')}</Button
				>{:else}<Button onclick={() => (revealed = cards.length)}
					>{$_('boosterPreview.reveal_all')}</Button
				>{/if}
		</footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.opening-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 18px;
		align-items: start;
	}
	.opening-slot.landscape:last-child {
		grid-column: 2 / span 3;
	}
	.card-back {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 862 / 1221;
		padding: 5%;
		border: 1px solid #feb823b8;
		background: radial-gradient(circle at 50% 43%, #1c455a, #07121f 52%, #030914);
		color: #feb823;
		container-type: inline-size;
		cursor: pointer;
		clip-path: polygon(6% 0, 94% 0, 100% 4%, 100% 96%, 94% 100%, 6% 100%, 0 96%, 0 4%);
	}
	.card-back.landscape {
		aspect-ratio: 1221 / 862;
	}
	.card-back:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.card-back:focus-visible {
		outline: 3px solid var(--energy-soft);
		outline-offset: 4px;
	}
	.back-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: space-around;
		border: 1px solid #feb82373;
		clip-path: polygon(5% 0, 95% 0, 100% 4%, 100% 96%, 95% 100%, 5% 100%, 0 96%, 0 4%);
		box-shadow: inset 0 0 28px rgb(0 0 0 / 55%);
	}
	.back-brand {
		font: bold 11cqw var(--font-heading);
		letter-spacing: 0.05em;
		text-transform: uppercase;
		text-shadow: 0 2px 0 #6f2607;
	}
	.back-symbol {
		display: grid;
		width: 34%;
		aspect-ratio: 1;
		place-items: center;
		padding: 8%;
		background: #091627;
		border: 1px solid #feb8239c;
		transform: rotate(45deg);
	}
	.back-symbol :global(svg) {
		transform: rotate(-45deg);
	}
	.back-number {
		font: 700 15cqw var(--font-heading);
	}
	.back-action {
		font: 600 7cqw var(--font-title);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.card-back.landscape .back-brand {
		font-size: 7cqw;
	}
	.card-back.landscape .back-symbol {
		width: 21%;
		padding: 5%;
	}
	.card-back.landscape .back-number {
		font-size: 9cqw;
	}
	.card-back.landscape .back-action {
		font-size: 4cqw;
	}
	.revealed {
		animation: appear 0.35s ease-out both;
	}
	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(12px) rotateY(20deg);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (max-width: 700px) {
		.opening-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 20px 14px;
		}
		.opening-slot:last-child {
			grid-column: 1 / -1;
			width: calc(50% - 7px);
			margin-inline: auto;
		}
		.opening-slot.landscape:last-child {
			width: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.revealed {
			animation: none;
		}
	}
</style>
