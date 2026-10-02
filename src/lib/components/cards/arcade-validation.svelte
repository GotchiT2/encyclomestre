<script lang="ts">
	import { _ } from 'svelte-i18n';
	import TemplateCard from '$lib/card-renderer/template-card.svelte';
	import ArcadePack from '$lib/card-renderer/arcade-pack.svelte';
	import { variantDefinition } from '$lib/card-renderer/presentation';
	import { Button } from '$lib/components/ui/button';
	import type { CardRecord } from '$lib/types';
	let { examples }: { examples: CardRecord[] } = $props();
	let source = $state(false),
		reveal = $state(false);
	const cases = $derived([
		...examples.map((card) => ({
			title: card.title,
			image: '/images/booster-preview/karina.jpg',
			variant: card.variant,
			fullArt: card.variant.styles.includes('FULL_ART')
		})),
		{
			title: $_('arcade.validationLongTitle'),
			image: '/images/booster-preview/blackpink.png',
			variant: examples[0].variant,
			fullArt: false
		},
		{ title: '', image: '', variant: examples[2].variant, fullArt: false }
	]);
</script>

<div class="my-5 flex flex-wrap gap-2">
	<Button aria-pressed={!source} onclick={() => (source = false)}>{$_('arcade.arcadeView')}</Button
	><Button variant="outline" aria-pressed={source} onclick={() => (source = true)}
		>{$_('arcade.source')}</Button
	><Button variant="outline" aria-pressed={reveal} onclick={() => (reveal = !reveal)}
		>{$_('arcade.revealPreview')}</Button
	>
</div>
<div class="arcade-card-grid validation-cards">
	{#each cases as item, i (i)}<figure class="min-w-0">
			<div class="validation-slot">
				<TemplateCard
					definition={variantDefinition(item.variant.color, item.variant.styles.includes('CHROME'))}
					data={{
						title: item.title,
						image: item.image,
						variantName: item.variant.name,
						fullArt: item.fullArt,
						edition: $_('arcade.validationPack'),
						serial: i === 5 ? undefined : i + 1
					}}
					labels={{ missing: $_('cardTemplates.missing'), untitled: $_('cardTemplates.untitled') }}
					profile={source ? 'source' : 'arcade'}
					{reveal}
				/>
			</div>
			<figcaption class="py-3 text-sm">
				{i === 4
					? $_('arcade.validationLandscape')
					: i === 5
						? $_('arcade.validationMissing')
						: item.variant.name}
			</figcaption>
		</figure>{/each}
</div>
<div class="mt-6 max-w-52">
	<ArcadePack
		name={$_('arcade.validationPack')}
		cardCount={5}
		labels={{ brand: $_('arcade.brand'), cards: $_('arcade.cardsLabel') }}
	/>
</div>

<style>
	.validation-slot {
		min-width: 0;
		aspect-ratio: 1/1.416;
		display: flex;
		align-items: center;
	}
	.validation-slot :global([data-testid='template-card']) {
		width: 100%;
	}
</style>
