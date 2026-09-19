<script lang="ts">
	import { _ } from '$lib/i18n';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import VariantCard from './variant-card.svelte';
	import PackArt from './pack-art.svelte';
	import {
		getVariant,
		isLandscapeCard,
		subjects,
		previewCard,
		poolKey,
		stockFor,
		unavailableReason,
		type PreviewPack,
		type PreviewSession,
		type PreviewCard
	} from './catalogue';
	let {
		pack,
		session,
		now,
		onClose,
		onOpen,
		onOpenCard,
		missingImage = false
	}: {
		pack: PreviewPack;
		session: PreviewSession;
		now: number;
		onClose: () => void;
		onOpen: (pack: PreviewPack) => void;
		onOpenCard: (card: PreviewCard) => void;
		missingImage?: boolean;
	} = $props();
	let tab = $state<'variants' | 'stock'>('variants');
	let subjectId = $state('');
	const reason = $derived(unavailableReason(pack, session, now));
	const numbered = $derived(pack.variantIds.map(getVariant).filter((variant) => variant.printRun));
</script>

<Dialog.Root
	open
	onOpenChange={(open) => {
		if (!open) onClose();
	}}
>
	<Dialog.Content
		class="flex h-[100dvh] max-h-[100dvh] w-screen max-w-6xl flex-col gap-0 border border-solid max-sm:left-0 max-sm:translate-x-0 sm:h-[min(820px,90dvh)] sm:max-h-[90dvh] sm:w-[calc(100%-3rem)]"
	>
		<header class="shrink-0 border-b border-border px-5 py-6 pr-12 sm:px-8">
			<p class="forge-label mb-2">{pack.edition}</p>
			<Dialog.Title class="font-serif text-3xl"
				>{$_(`boosterPreview.packs.${pack.nameKey}`)}</Dialog.Title
			><Dialog.Description class="mt-2 text-sm"
				>{$_(`boosterPreview.descriptions.${pack.descriptionKey}`)}</Dialog.Description
			>
		</header>
		<div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
			<div class="grid gap-8 md:grid-cols-[170px_1fr]">
				<div class="mx-auto hidden w-[170px] md:block"><PackArt {pack} /></div>
				<div>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="border-l border-primary/50 pl-4">
							<p class="forge-label">{$_('boosterPreview.composition')}</p>
							<p class="mt-2 text-sm">{$_(`boosterPreview.rules.${pack.kind}`)}</p>
						</div>
						<div class="border-l border-primary/50 pl-4">
							<p class="forge-label">{$_('boosterPreview.availability')}</p>
							<p class="mt-2 text-sm">{$_(`boosterPreview.periods.${pack.kind}`)}</p>
						</div>
						<div class="border-l border-primary/50 pl-4">
							<p class="forge-label">{$_('boosterPreview.numbered_stock')}</p>
							<p class="mt-2 font-heading text-3xl">
								{pack.kind === 'daily' ? '—' : stockFor(pack, session)}
							</p>
						</div>
					</div>
					<p class="mt-5 text-xs leading-relaxed text-muted-foreground">
						{$_('boosterPreview.demo_odds')}
					</p>
					{#if pack.kind === 'annual' && stockFor(pack, session) === 0}<p
							class="mt-3 text-sm text-primary"
						>
							{$_('boosterPreview.chrome_empty')}
						</p>{/if}
				</div>
			</div>
			<div
				class="mt-8 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"
			>
				<div class="flex gap-2" role="group" aria-label={$_('boosterPreview.pack_sections')}>
					<Button
						variant={tab === 'variants' ? 'secondary' : 'ghost'}
						aria-pressed={tab === 'variants'}
						onclick={() => (tab = 'variants')}>{$_('boosterPreview.variants')}</Button
					><Button
						variant={tab === 'stock' ? 'secondary' : 'ghost'}
						aria-pressed={tab === 'stock'}
						onclick={() => (tab = 'stock')}>{$_('boosterPreview.stock')}</Button
					>
				</div>
				<label class="text-xs text-muted-foreground" for="pack-subject"
					>{$_('boosterPreview.subject')}<select
						id="pack-subject"
						bind:value={subjectId}
						class="ml-2 max-w-[190px] border-border bg-card text-sm text-foreground"
						><option value="">{$_('boosterPreview.all_subjects')}</option
						>{#each subjects as subject (subject.id)}<option value={subject.id}
								>{subject.title}</option
							>{/each}</select
					></label
				>
			</div>
			{#if tab === 'variants'}
				<div class="variants-grid">
					{#each pack.variantIds as variantId (variantId)}{@const variant = getVariant(variantId)}
						{@const card = previewCard(pack, variantId, subjectId || pack.heroSubject)}
						<div class:landscape={isLandscapeCard(card)}>
							<VariantCard {card} onOpen={onOpenCard} {missingImage} />
							<p class="mt-3 text-xs text-muted-foreground">
								{variant.printRun
									? $_('boosterPreview.print_run', { values: { total: variant.printRun } })
									: $_('boosterPreview.unnumbered')}
							</p>
						</div>{/each}
				</div>
			{:else if numbered.length === 0}
				<p class="py-12 text-center text-muted-foreground">{$_('boosterPreview.no_numbered')}</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<caption class="mb-4 text-left text-xs text-muted-foreground"
							>{$_('boosterPreview.stock_caption')}</caption
						><thead class="border-b border-border text-xs text-muted-foreground"
							><tr
								><th class="py-3 pr-3">{$_('boosterPreview.subject')}</th><th class="px-3"
									>{$_('boosterPreview.finish')}</th
								><th class="px-3 text-right">{$_('boosterPreview.remaining')}</th><th
									class="pl-3 text-right">{$_('boosterPreview.total')}</th
								></tr
							></thead
						><tbody>
							{#each subjects.filter((subject) => !subjectId || subjectId === subject.id) as subject (subject.id)}{#each numbered as variant (variant.id)}{@const remaining =
										session.pools[poolKey(pack.id, subject.id, variant.id)].length}<tr
										class="border-b border-border/40"
										><td class="max-w-[250px] py-3 pr-3"
											><button
												class="text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
												onclick={() => onOpenCard(previewCard(pack, variant.id, subject.id))}
												>{subject.title}</button
											></td
										><td class="px-3"
											><span
												class="mr-2 inline-block size-2 rounded-full"
												style={`background:${variant.color}`}
											></span>{variant.name}</td
										><td
											class="px-3 text-right font-semibold tabular-nums"
											class:text-muted-foreground={remaining === 0}>{remaining}</td
										><td class="pl-3 text-right text-muted-foreground tabular-nums"
											>{variant.printRun}</td
										></tr
									>{/each}{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
		<footer
			class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background/80 px-5 py-4 sm:px-8"
		>
			<p class="text-xs text-muted-foreground">{$_('boosterPreview.simulation_short')}</p>
			<Button disabled={Boolean(reason)} onclick={() => onOpen(pack)}
				>{reason ? $_(`boosterPreview.status.${reason}`) : $_('boosterPreview.open')}</Button
			>
		</footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.variants-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem;
		align-items: start;
	}
	.variants-grid > .landscape {
		grid-column: 1 / -1;
	}
	@media (min-width: 640px) {
		.variants-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.variants-grid > .landscape {
			grid-column: span 2;
		}
	}
	@media (min-width: 1024px) {
		.variants-grid {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}
</style>
