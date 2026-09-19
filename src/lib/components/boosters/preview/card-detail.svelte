<script lang="ts">
	import { _ } from '$lib/i18n';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import VariantCard from './variant-card.svelte';
	import { getSubject, getVariant, isLandscapeCard, type PreviewCard } from './catalogue';
	let {
		card,
		onClose,
		missingImage = false
	}: { card: PreviewCard; onClose: () => void; missingImage?: boolean } = $props();
	const subject = $derived(getSubject(card.subjectId));
	const variant = $derived(getVariant(card.variantId));
	const landscape = $derived(isLandscapeCard(card));
	let content = $state<HTMLDivElement | null>(null);
</script>

<Dialog.Root
	open
	onOpenChange={(open) => {
		if (!open) onClose();
	}}
>
	<Dialog.Content
		bind:ref={content}
		onOpenAutoFocus={(event) => {
			event.preventDefault();
			content?.focus({ preventScroll: true });
		}}
		class="flex max-h-[100dvh] w-screen max-w-4xl overflow-hidden border border-solid max-sm:left-0 max-sm:translate-x-0 sm:max-h-[90dvh] sm:w-[calc(100%-3rem)]"
	>
		<div class="detail-grid" class:landscape>
			<div class="card-preview">
				<VariantCard {card} {missingImage} decorative />
			</div>
			<div class="min-w-0">
				<p class="forge-label mb-3">{variant.name}</p>
				<Dialog.Title class="font-serif text-3xl leading-tight">{subject.title}</Dialog.Title>
				<Dialog.Description class="mt-4 text-base leading-relaxed text-muted-foreground"
					>{$_(`boosterPreview.subjects.${subject.descriptionKey}`)}</Dialog.Description
				>
				<dl class="my-6 grid grid-cols-2 gap-4 border-y border-border py-5 text-sm">
					<div>
						<dt class="text-muted-foreground">{$_('boosterPreview.edition')}</dt>
						<dd class="mt-1 font-semibold">{card.edition}</dd>
					</div>
					<div>
						<dt class="text-muted-foreground">{$_('boosterPreview.finish')}</dt>
						<dd class="mt-1 font-semibold">{variant.name}</dd>
					</div>
					{#if card.serial}<div class="col-span-2">
							<dt class="text-muted-foreground">{$_('boosterPreview.serial')}</dt>
							<dd class="mt-1 font-heading text-3xl text-primary">
								{card.serial.number}/{card.serial.total}
							</dd>
						</div>
					{:else if variant.printRun}<div class="col-span-2 text-muted-foreground">
							{$_('boosterPreview.preview_serial', { values: { total: variant.printRun } })}
						</div>{/if}
				</dl>
				<p class="text-sm text-muted-foreground">{$_('boosterPreview.image_treatment')}</p>
				<div class="mt-6 text-xs leading-relaxed text-muted-foreground">
					<p class="mb-2 font-semibold text-foreground">{$_('boosterPreview.credits')}</p>
					<p>{subject.author} · {subject.license}</p>
					<div class="mt-1 flex flex-wrap gap-x-4">
						<Button variant="link" href={subject.source} target="_blank" rel="noreferrer"
							>{$_('boosterPreview.source')}</Button
						><Button variant="link" href={subject.licenseUrl} target="_blank" rel="noreferrer"
							>{$_('boosterPreview.license')}</Button
						>
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.detail-grid {
		display: grid;
		min-height: 0;
		align-items: center;
		gap: 2rem;
		overflow-y: auto;
		padding: 1.5rem;
	}
	.card-preview {
		width: 100%;
		max-width: 360px;
		margin-inline: auto;
	}
	.detail-grid.landscape .card-preview {
		max-width: 720px;
	}
	@media (min-width: 768px) {
		.detail-grid {
			grid-template-columns: minmax(0, 360px) 1fr;
			padding: 2.5rem;
		}
		.detail-grid.landscape {
			grid-template-columns: 1fr;
		}
		.detail-grid.landscape > .min-w-0 {
			max-width: 720px;
			margin-inline: auto;
		}
	}
</style>
