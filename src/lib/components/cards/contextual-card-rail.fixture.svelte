<script lang="ts">
	import ContextualCardRail from './contextual-card-rail.svelte';

	const items = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
</script>

<ContextualCardRail
	{items}
	label="Cartes contextuelles"
	itemKey={(item) => item}
	desktopGridClass="lg:grid-cols-4"
>
	{#snippet children(item)}
		<article class="min-h-48 border border-primary">{item}</article>
	{/snippet}
</ContextualCardRail>
