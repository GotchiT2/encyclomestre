<script lang="ts">
	import { _ } from '$lib/i18n';

	let { total }: { total: number } = $props();

	const formatCount = new Intl.NumberFormat('fr-FR').format;
</script>

<!-- La répartition par rareté est portée par les pastilles du filtre : ici, seul le total. -->
<section
	class="flex flex-col gap-3 border-y border-primary/20 bg-background/35 px-3 py-3"
	aria-live="polite"
	data-testid="catalogue-result-summary"
>
	<p class="font-mono text-xs font-bold tracking-wide text-primary">
		{$_('codex.resultsCount', { values: { count: formatCount(total) } })}
	</p>
</section>
