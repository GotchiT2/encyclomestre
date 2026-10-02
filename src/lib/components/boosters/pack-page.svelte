<script lang="ts">
	import { packNameKey, packDescriptionKey } from './pack-labels';
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
	const packName = $derived(
		details ? (packNameKey(details.name) ? $_(packNameKey(details.name)!) : details.name) : ''
	);
	const packDescription = $derived(
		details
			? packDescriptionKey(details.description)
				? $_(packDescriptionKey(details.description)!)
				: details.description
			: ''
	);
	const date = (value?: string) =>
		value && Number.isFinite(Date.parse(value))
			? new Date(value).toLocaleString('fr-FR')
			: $_('plan.unknownDate');
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
			{packName}
		</h1>
		<div class="flex flex-col gap-6 sm:flex-row">
			<div class="mx-auto w-40 shrink-0">
				<BoosterPackArt
					name={packName}
					renderKey={details.renderKey}
					family={details.family}
					cardCount={details.nbCards}
				/>
			</div>
			<div class="flex flex-col gap-4">
				<details>
					<summary class="min-h-11">{$_('boosters.detail.title')}</summary>
					<p>{packDescription}</p>
				</details>
				<p>{$_('boosters.pack_card_count', { values: { count: details.nbCards } })}</p>
				<p>
					{$_('boosters.detail.status')} : {[
						'OPEN',
						'UPCOMING',
						'EXHAUSTED',
						'ENDED',
						'CLOSED'
					].includes(details.status)
						? $_('boosters.status.' + details.status)
						: $_('boosters.status.CLOSED')}
				</p>
				{#if details.startsAt || details.endsAt}<p class="text-sm text-muted-foreground">
						{date(details.startsAt)} → {date(details.endsAt)}
					</p>{/if}
				<Button href={'/boosters?pack=' + details.id}
					>{$_(details.status === 'OPEN' ? 'boosters.open' : 'arcade.allPacks')}</Button
				>
			</div>
		</div>
		<PackPoolBrowser {details} />{/if}
</section>
