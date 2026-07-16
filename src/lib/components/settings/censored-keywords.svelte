<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	let { keywords = $bindable<string[]>([]) }: { keywords?: string[] } = $props();
	let value = $state('');
	function add() {
		const keyword = value.trim();
		if (keyword && !keywords.includes(keyword)) keywords = [...keywords, keyword];
		value = '';
	}
</script>

<section class="border-4 border-double border-primary/30 bg-card p-4">
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('settings.censorship')}
	</p>
	<p class="mt-2 font-serif text-sm italic text-muted-foreground">
		{$_('settings.censorship_hint')}
	</p>
	<div class="mt-3 flex gap-2">
		<Input
			bind:value
			onkeydown={(event) => event.key === 'Enter' && add()}
			placeholder={$_('settings.keyword_placeholder')}
		/><Button onclick={add}>{$_('common.add')}</Button>
	</div>
	<div class="mt-3 flex flex-wrap gap-1.5">
		{#each keywords as keyword (keyword)}<Button
				size="xs"
				variant="outline"
				onclick={() => (keywords = keywords.filter((entry) => entry !== keyword))}
				>{keyword} ×</Button
			>{/each}
	</div>
</section>
