<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { sanctions, refreshSanctions, currentSanctions } from '$lib/moderation/state';
	import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';
	import { _ } from '$lib/i18n';
	let { kind, showEmpty = false }: { kind?: 'MUTE' | 'TRADE'; showEmpty?: boolean } = $props();
	let now = $state(Date.now());
	let failed = $state(false);
	const items = $derived(
		currentSanctions($sanctions, now).filter((item) => !kind || item.type === kind)
	);
	onMount(() => {
		const load = () =>
			void refreshSanctions()
				.then(() => (failed = false))
				.catch(() => (failed = true));
		load();
		const timer = setInterval(() => (now = Date.now()), 1000);
		window.addEventListener('focus', load);
		return () => {
			clearInterval(timer);
			window.removeEventListener('focus', load);
		};
	});
</script>

{#if failed}<p role="status" class="text-sm text-muted-foreground">
		{$_('completion.moderation.readError')}
	</p>{/if}
{#each items as item, index (index)}<aside
		class="flex flex-col gap-2 border border-destructive/50 bg-destructive/5 p-4"
		role="status"
	>
		<strong>{$_(`completion.moderation.${item.type}`)}</strong>
		<p class="whitespace-pre-wrap break-words">{item.reason}</p>
		<p class="text-sm">
			{item.endsAt
				? $_('completion.moderation.until', {
						values: { date: wikiForgeUtcDate(item.endsAt).toLocaleString('fr-FR') }
					})
				: $_('completion.moderation.permanent')}
		</p>
		{#if item.startsAt}<p class="text-sm">
				{$_('completion.moderation.since', {
					values: { date: wikiForgeUtcDate(item.startsAt).toLocaleString('fr-FR') }
				})}
			</p>{/if}
		<a class="underline" href={resolve('/moderation')}>{$_('completion.moderation.open')}</a>
	</aside>{/each}
{#if showEmpty && !items.length && !failed}<p class="text-muted-foreground">
		{$_('completion.moderation.noSanctions')}
	</p>{/if}
