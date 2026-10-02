<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { isMockApiEnabled } from '$lib/api/client';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import ArcadeValidation from '$lib/components/cards/arcade-validation.svelte';
	import type { CardRecord } from '$lib/types';
	let examples = $state<CardRecord[]>([]);
	onMount(async () => {
		if (isMockApiEnabled()) examples = (await import('$lib/api/mocks/cards')).mockCards.slice(0, 4);
	});
</script>

<PageHeader
	eyebrow={$_('arcade.studio')}
	title={$_('arcade.validationTitle')}
	description={$_('arcade.validationDescription')}
/>
{#if isMockApiEnabled() && examples.length}<ArcadeValidation {examples} />{:else}<p
		role="status"
		class="mt-6"
	>
		{$_('arcade.validationMockOnly')}
	</p>{/if}
