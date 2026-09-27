<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		getPackDetails,
		resetPackDetailsCache,
		resolvePackDefinition,
		type ResolvedPackDefinition
	} from '$lib/api/boosters';
	import { getVariants } from '$lib/api/variants';
	import PackPoolBrowser from './pack-pool-browser.svelte';
	import BoosterPackArt from './booster-pack-art.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let { id }: { id: string } = $props();
	let details = $state<ResolvedPackDefinition>();
	let error = $state('');
	let busy = $state(true);
	let generation = 0;
	async function load() {
		const request = ++generation;
		busy = true;
		error = '';
		try {
			resetPackDetailsCache();
			const [pack, variants] = await Promise.all([getPackDetails(Number(id)), getVariants()]);
			if (request === generation) details = resolvePackDefinition(pack, variants);
		} catch (cause) {
			if (request === generation) error = operationError(cause);
		} finally {
			if (request === generation) busy = false;
		}
	}
	$effect(() => {
		void id;
		untrack(() => void load());
		return () => {
			generation++;
		};
	});
</script>

<section class="flex min-w-0 flex-col gap-6 pb-10">
	<Button variant="outline" href={resolve('/boosters')}>{$_('boosters.title')}</Button>{#if busy}<p>
			{$_('completion.loading')}
		</p>{:else if error}<p role="alert">{error}</p>
		<Button onclick={load}>{$_('completion.retry')}</Button>{:else if details}<h1
			class="font-title text-3xl"
		>
			{details.name}
		</h1>
		<div class="flex flex-col gap-6 sm:flex-row">
			<div class="mx-auto w-40 shrink-0">
				<BoosterPackArt
					name={details.name}
					renderKey={details.renderKey ?? 'standard'}
					cardCount={details.nbCards}
					imageUrl={details.imageUrl}
				/>
			</div>
			<div class="flex flex-col gap-4">
				<p>{details.description}</p>
				<p>{$_('boosters.pack_card_count', { values: { count: details.nbCards } })}</p>
				<p>
					{$_('boosters.detail.status')} : {['OPEN', 'UPCOMING', 'EXHAUSTED', 'ENDED'].includes(
						details.status
					)
						? $_('boosters.status.' + details.status)
						: details.status}
				</p>
				<p>{details.startsAt ?? '—'} → {details.endsAt ?? '—'}</p>
			</div>
		</div>
		<PackPoolBrowser {details} />{/if}
</section>
