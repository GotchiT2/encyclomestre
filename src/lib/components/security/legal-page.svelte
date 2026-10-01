<script lang="ts">
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import LegalLinks from './legal-links.svelte';
	let { kind }: { kind: 'legal' | 'privacy' | 'terms' } = $props();
	const sections = {
		legal: ['publisher', 'hosting', 'contact'],
		privacy: ['data', 'purposes', 'retention', 'rights'],
		terms: ['access', 'collection', 'transactions', 'restrictions']
	} as const;
</script>

<section class="mx-auto max-w-3xl space-y-6 py-8">
	<a href={resolve('/')} class="text-sm underline">{$_('plan.legal.home')}</a>
	<h1 class="text-3xl font-semibold">{$_('plan.legal.' + kind)}</h1>
	<p class="rounded border border-primary/40 p-4" role="note">{$_('plan.legal.draft')}</p>
	{#each sections[kind] as section (section)}<article class="forge-panel space-y-2 p-4">
			<h2 class="text-xl font-semibold">{$_('plan.legal.sections.' + section)}</h2>
			<p class="text-muted-foreground">{$_('plan.legal.incomplete')}</p>
		</article>{/each}<LegalLinks />
</section>
