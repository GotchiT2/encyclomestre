<script lang="ts">
	let {
		label,
		value,
		accent = false
	}: { label: string; value: string | number; accent?: boolean } = $props();
</script>

<div class="border-l-2 border-primary/55 bg-background/45 px-4 py-3">
	<p class="forge-label text-[9px]">{label}</p>
	<p
		class="mt-1 font-heading text-2xl tracking-wider"
		class:text-primary={accent}
		class:text-foreground={!accent}
	>
		{value}
	</p>
</div>
