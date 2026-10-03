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

<section class="mx-auto max-w-3xl space-y-8 leading-relaxed py-8">
	<a href={resolve('/')} class="text-sm underline">{$_('plan.legal.home')}</a>
	<h1 class="text-5xl font-black">{$_('plan.legal.' + kind)}</h1>
	<p class="border-l-4 border-primary bg-card p-4" role="note">{$_('plan.legal.draft')}</p>
	<nav class="legal-contents" aria-label={$_('arcade.contents')}>
		{#each sections[kind] as section (section)}<a href={'#' + section}
				>{$_('plan.legal.sections.' + section)}</a
			>{/each}
	</nav>
	{#each sections[kind] as section (section)}<article
			id={section}
			class="space-y-2 border-b border-border py-5"
		>
			<h2 class="text-xl font-semibold">{$_('plan.legal.sections.' + section)}</h2>
			<p class="text-muted-foreground">{$_('plan.legal.incomplete')}</p>
		</article>{/each}<LegalLinks />
</section>

<style>
	.legal-contents {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
		border-block: 1px solid var(--border);
		padding: 12px 0;
	}
	.legal-contents a {
		min-height: 44px;
		display: flex;
		align-items: center;
		text-decoration: underline;
	}
</style>
