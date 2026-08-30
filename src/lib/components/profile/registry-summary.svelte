<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { ProfileRegistrySummary } from '$lib/types';
	let { summary }: { summary: ProfileRegistrySummary } = $props();
</script>

<section
	class="border-4 border-double border-primary/30 bg-card p-4"
	aria-labelledby="registry-summary-title"
>
	<h2
		id="registry-summary-title"
		class="text-xl font-black uppercase tracking-tight text-foreground"
	>
		{$_('profile.registrySummary')}
	</h2>
	<dl class="mt-4 grid grid-cols-3 divide-x divide-primary/10 border-y border-primary/10">
		<div class="py-3">
			<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				{$_('profile.ownedCards')}
			</dt>
			<dd class="font-mono text-lg text-primary">{summary.ownedCards}</dd>
		</div>
		<div class="px-3 py-3">
			<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				{$_('profile.totalCopies')}
			</dt>
			<dd class="font-mono text-lg text-primary">{summary.totalCopies}</dd>
		</div>
		<div class="pl-3 py-3">
			<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				{$_('profile.rareCards')}
			</dt>
			<dd class="font-mono text-lg text-primary">{summary.rareCards}</dd>
		</div>
	</dl>
	{#if summary.publicTags.length}<div class="mt-4 flex flex-wrap gap-2">
			{#each summary.publicTags as tag (tag.id)}<span
					class="border border-primary/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-background"
					style={`background-color:${tag.color}`}>{tag.name}</span
				>{/each}
		</div>{/if}
</section>
