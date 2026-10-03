<script lang="ts">
	import { _ } from 'svelte-i18n';
	import TemplateCard from '$lib/card-renderer/template-card.svelte';
	import { validateDefinition } from '$lib/card-renderer/definition';
	import rose from '$lib/card-renderer/templates/prestige-rose-champagne.json';
	import karina from '$lib/card-renderer/templates/prestige-karina-platinum.json';
	let { reveal = false }: { reveal?: boolean } = $props();
	const examples = [
		{
			id: 'prestige-rose-champagne',
			name: 'rose',
			edition: 'blackpink',
			definition: validateDefinition(rose),
			image: '/images/booster-preview/blackpink.png'
		},
		{
			id: 'prestige-karina-platinum',
			name: 'karina',
			edition: 'aespa',
			definition: validateDefinition(karina),
			image: '/images/booster-preview/karina.jpg'
		}
	];
</script>

<div class="prestiges" data-testid="prestige-previews">
	{#each examples as example (example.id)}
		<figure data-design-case={example.id}>
			<div class="sample">
				<TemplateCard
					definition={example.definition}
					data={{
						title: $_('cardDesigns.prestige.' + example.name),
						edition: $_('cardDesigns.prestige.' + example.edition),
						image: example.image,
						fullArt: true,
						variantName: '',
						serial: 17,
						maximum: 99
					}}
					labels={{ missing: $_('cardTemplates.missing'), untitled: $_('cardTemplates.untitled') }}
					{reveal}
				/>
			</div>
			<figcaption>{$_('cardDesigns.prestige.' + example.name + 'Caption')}</figcaption>
		</figure>
	{/each}
</div>

<style>
	.prestiges {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(144px, 1fr));
		gap: 1.25rem;
		margin-block: 2rem;
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
