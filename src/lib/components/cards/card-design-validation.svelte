<script lang="ts">
	import { _ } from 'svelte-i18n';
	import TemplateCard from '$lib/card-renderer/template-card.svelte';
	import { cardDefinition, effectPresets } from '$lib/card-renderer/card-presets';
	import { Button } from '$lib/components/ui/button';
	let reveal = $state(false);
	const examples = [
		{ id: 'normal-long', fullArt: false, image: '/images/booster-preview/karina.jpg', long: true },
		{
			id: 'normal-landscape-image',
			fullArt: false,
			image: '/images/booster-preview/blackpink.png',
			long: false
		},
		{
			id: 'full-long-portrait',
			fullArt: true,
			image: '/images/booster-preview/karina.jpg',
			long: true
		},
		{
			id: 'full-long-landscape',
			fullArt: true,
			image: '/images/booster-preview/blackpink.png',
			long: true
		},
		{ id: 'normal-missing', fullArt: false, image: '', long: true },
		{ id: 'full-placeholder', fullArt: true, image: '/card-placeholder.svg', long: true },
		{
			id: 'full-failed-image',
			fullArt: true,
			image: 'data:image/png;base64,bm90LWFuLWltYWdl',
			long: true
		}
	];
</script>

<section class="card-designs" data-testid="card-design-validation">
	<header>
		<h2>{$_('cardDesigns.title')}</h2>
		<p>{$_('cardDesigns.description')}</p>
		<Button variant="outline" aria-pressed={reveal} onclick={() => (reveal = !reveal)}
			>{$_('arcade.revealPreview')}</Button
		>
	</header>
	<div class="examples">
		{#each examples as example (example.id)}<figure data-design-case={example.id}>
				<div class="sample">
					<TemplateCard
						definition={cardDefinition(example.fullArt)}
						data={{
							title: example.long ? $_('cardDesigns.longTitle') : $_('cardDesigns.shortTitle'),
							image: example.image,
							fullArt: example.fullArt,
							variantName: '',
							description: $_('cardDesigns.sampleDescription'),
							edition: $_('cardDesigns.collection'),
							serial: 17,
							maximum: 99
						}}
						labels={{
							missing: $_('cardTemplates.missing'),
							untitled: $_('cardTemplates.untitled')
						}}
						{reveal}
					/>
				</div>
				<figcaption>{$_('cardDesigns.cases.' + example.id)}</figcaption>
			</figure>{/each}
	</div>
	<div class="effects">
		{#each effectPresets.filter((e) => e !== 'none') as effect (effect)}<figure
				data-design-case={effect}
			>
				<div class="sample">
					<TemplateCard
						definition={cardDefinition(true, effect)}
						data={{
							title: $_('cardDesigns.longTitle'),
							image: '/images/booster-preview/karina.jpg',
							fullArt: true,
							variantName: '',
							edition: $_('cardDesigns.collection'),
							serial: 17,
							maximum: 99
						}}
						labels={{
							missing: $_('cardTemplates.missing'),
							untitled: $_('cardTemplates.untitled')
						}}
						{reveal}
					/>
				</div>
				<figcaption>{$_('cardDesigns.effects.' + effect)}</figcaption>
			</figure>{/each}
	</div>
</section>

<style>
	.card-designs {
		margin-block: 2rem;
		min-width: 0;
	}
	.card-designs header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin-block: 1rem;
	}
	.card-designs h2 {
		font:
			800 2rem/1 'Barlow Condensed',
			sans-serif;
	}
	.card-designs header p {
		flex-basis: 100%;
	}
	.examples,
	.effects {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(144px, 1fr));
		gap: 1.25rem;
		align-items: start;
	}
	.effects {
		margin-top: 2rem;
	}
	.sample {
		width: 144px;
		max-width: 100%;
	}
	figure {
		margin: 0;
		min-width: 0;
	}
	figcaption {
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}
</style>
