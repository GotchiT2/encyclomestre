<script lang="ts">
	import { apiRequest } from '$lib/api/client';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { operationError } from '$lib/domain/operation-error';
	let stats = $state<{ nbCards: number; nbDistinctPages: number; nbActivePages: number }>();
	let busy = $state(false);
	let error = $state('');
	async function load() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			stats = await apiRequest('/collection/stats');
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
	const coverage = $derived(
		stats?.nbActivePages ? Math.min(100, (stats.nbDistinctPages / stats.nbActivePages) * 100) : 0
	);
</script>

<details
	class="forge-panel p-4"
	ontoggle={(event) => {
		if (event.currentTarget.open && !stats) void load();
	}}
>
	<summary class="min-h-11 cursor-pointer content-center font-bold"
		>{$_('apiEvolution.progress.title')}</summary
	>
	<p class="mb-3 text-sm text-muted-foreground">{$_('apiEvolution.progress.help')}</p>
	{#if stats}<p>
			{$_('apiEvolution.progress.counts', {
				values: {
					cards: stats.nbCards,
					distinct: stats.nbDistinctPages,
					total: stats.nbActivePages
				}
			})}
		</p>
		<progress
			class="my-3 w-full accent-primary"
			max="100"
			value={coverage}
			aria-label={$_('apiEvolution.progress.title')}
		></progress>
		<p>{coverage.toLocaleString('fr', { maximumFractionDigits: 3 })} %</p>{/if}
	{#if error}<p role="alert">{error}</p>{/if}
	<Button variant="outline" disabled={busy} onclick={load}
		>{$_(busy ? 'completion.loading' : 'completion.refresh')}</Button
	>
</details>
