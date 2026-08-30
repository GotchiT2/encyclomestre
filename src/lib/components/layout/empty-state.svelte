<script lang="ts">
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	let { title, description }: { title: string; description?: string } = $props();
</script>

<div class="forge-panel-flat grid min-h-44 place-items-center px-6 py-10 text-center">
	<div>
		<SparklesIcon class="mx-auto size-6 text-primary" />
		<p class="mt-3 text-xl font-bold text-foreground">{title}</p>
		{#if description}<p class="mt-2 text-sm text-muted-foreground">{description}</p>{/if}
	</div>
</div>
