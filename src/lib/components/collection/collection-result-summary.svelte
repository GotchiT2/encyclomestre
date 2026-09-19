<script lang="ts">
	import { _ } from '$lib/i18n';

	let {
		total,
		loaded,
		hasNext
	}: {
		total: number;
		loaded: number;
		hasNext: boolean;
	} = $props();

	const countLabel = $derived(
		total >= 0
			? $_('collection.result_count', { values: { count: total } })
			: hasNext
				? $_('collection.loaded_count_more', { values: { count: loaded } })
				: $_('collection.result_count', { values: { count: loaded } })
	);
</script>

<section class="border-y border-primary/20 py-3">
	<p class="forge-label">{countLabel}</p>
</section>
