<script lang="ts">
	import PublicCardDetail from '$lib/components/cards/public-card-detail.svelte';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#await data.card}
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('codex.loading')}</p>
{:then card}
	<PublicCardDetail {card} />
{:catch}
	<p class="border border-destructive/40 bg-destructive/10 p-4 font-serif italic text-destructive">
		{$_('codex.error')}
	</p>
{/await}
