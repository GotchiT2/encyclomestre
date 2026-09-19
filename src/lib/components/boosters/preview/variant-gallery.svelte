<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import VariantCard from './variant-card.svelte';
	import {
		isLandscapeCard,
		packs,
		subjects,
		variants,
		previewCard,
		type PreviewCard
	} from './catalogue';
	let {
		onOpenCard,
		missingImage = false
	}: { onOpenCard: (card: PreviewCard) => void; missingImage?: boolean } = $props();
	let subjectId = $state('rose');
	let large = $state(false);
</script>

<section id="variant-gallery" class="scroll-mt-8 border-t border-border pt-10">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-5">
		<div>
			<p class="forge-label">{$_('boosterPreview.gallery_eyebrow')}</p>
			<h2 class="mt-2 font-serif text-3xl">{$_('boosterPreview.gallery_title')}</h2>
			<p class="mt-2 max-w-xl text-sm text-muted-foreground">
				{$_('boosterPreview.gallery_description')}
			</p>
		</div>
		<div class="flex flex-wrap items-end gap-3">
			<label class="text-xs text-muted-foreground" for="gallery-subject"
				>{$_('boosterPreview.subject')}<select
					id="gallery-subject"
					bind:value={subjectId}
					class="mt-1 block h-11 max-w-[260px] border-border bg-card text-sm text-foreground"
					>{#each subjects as subject (subject.id)}<option value={subject.id}
							>{subject.title}</option
						>{/each}</select
				></label
			>
			<div class="flex gap-1" role="group" aria-label={$_('boosterPreview.card_size')}>
				<Button
					variant={!large ? 'secondary' : 'ghost'}
					aria-pressed={!large}
					onclick={() => (large = false)}>{$_('boosterPreview.small')}</Button
				><Button
					variant={large ? 'secondary' : 'ghost'}
					aria-pressed={large}
					onclick={() => (large = true)}>{$_('boosterPreview.large')}</Button
				>
			</div>
		</div>
	</div>
	<div class="gallery-grid" class:large>
		{#each variants as variant (variant.id)}
			{@const pack = packs.find((entry) => entry.variantIds.includes(variant.id))!}
			{@const card = previewCard(pack, variant.id, subjectId)}
			<div class="gallery-item min-w-0" class:landscape={isLandscapeCard(card)}>
				<VariantCard {card} onOpen={onOpenCard} {missingImage} />
				<p class="mt-3 text-xs text-muted-foreground">
					{variant.printRun
						? $_('boosterPreview.print_run', { values: { total: variant.printRun } })
						: $_('boosterPreview.unnumbered')}
				</p>
			</div>
		{/each}
	</div>
</section>

<style>
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, 150px);
		gap: 28px 22px;
	}
	.gallery-grid.large {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 360px));
		gap: 32px;
	}
	.gallery-item.landscape {
		align-self: start;
	}
	@media (max-width: 380px) {
		.gallery-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 20px 12px;
		}
	}
</style>
