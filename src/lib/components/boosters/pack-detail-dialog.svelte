<script lang="ts">
	import { _ } from '$lib/i18n';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import type { ResolvedPackDefinition } from '$lib/api/boosters';
	import type { PackCatalogueItem } from '$lib/types';
	import BoosterPackArt from './booster-pack-art.svelte';
	import PackPoolBrowser from './pack-pool-browser.svelte';
	import { packDescriptionKey, packNameKey } from './pack-labels';

	let {
		pack,
		details,
		loading,
		error,
		onClose,
		onOpen
	}: {
		pack: PackCatalogueItem;
		details: ResolvedPackDefinition | null;
		loading: boolean;
		error: boolean;
		onClose: () => void;
		onOpen: () => void;
	} = $props();

	const knownName = $derived(packNameKey(pack.name));
	const knownDescription = $derived(packDescriptionKey(pack.description));
	const displayName = $derived(knownName ? $_(knownName) : pack.name);
	const displayDescription = $derived(knownDescription ? $_(knownDescription) : pack.description);
	const canOpen = $derived(pack.status === 'OPEN' && Boolean(pack.credit?.available));
	const date = (value?: string) =>
		value
			? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(
					new Date(value)
				)
			: null;
</script>

<Dialog.Root open onOpenChange={(open) => !open && onClose()}>
	<Dialog.Content
		class="flex h-[100dvh] max-h-[100dvh] w-screen max-w-6xl flex-col gap-0 border border-solid max-sm:left-0 max-sm:translate-x-0 sm:h-[min(840px,92dvh)] sm:max-h-[92dvh] sm:w-[calc(100%-3rem)]"
	>
		<header class="shrink-0 border-b border-border px-5 py-6 pr-12 sm:px-8">
			<p class="forge-label">{$_(`boosters.family.${pack.family}`)}</p>
			<Dialog.Title class="mt-2 font-serif text-3xl">{displayName}</Dialog.Title>
			<Dialog.Description class="mt-2 text-sm">{displayDescription}</Dialog.Description>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
			<div class="grid gap-8 md:grid-cols-[180px_1fr]">
				<div class="mx-auto w-36 md:w-[180px]">
					<BoosterPackArt
						name={displayName}
						renderKey={pack.renderKey ?? 'standard'}
						cardCount={pack.nbCards}
						imageUrl={pack.imageUrl}
					/>
				</div>
				<div class="grid content-start gap-5 sm:grid-cols-2">
					<div class="border-l border-primary/50 pl-4">
						<p class="forge-label">{$_('boosters.detail.status')}</p>
						<p class="mt-2 font-semibold">{$_(`boosters.status.${pack.status}`)}</p>
					</div>
					<div class="border-l border-primary/50 pl-4">
						<p class="forge-label">{$_('boosters.detail.composition')}</p>
						<p class="mt-2">
							{$_('boosters.pack_card_count', { values: { count: pack.nbCards } })}
						</p>
					</div>
					<div class="border-l border-primary/50 pl-4">
						<p class="forge-label">{$_('boosters.detail.period')}</p>
						<p class="mt-2 text-sm">
							{#if pack.startsAt || pack.endsAt}{date(pack.startsAt) ?? '—'} → {date(pack.endsAt) ??
									'—'}{:else}{$_('boosters.detail.no_period')}{/if}
						</p>
					</div>
					<div class="border-l border-primary/50 pl-4">
						<p class="forge-label">{$_('boosters.detail.credits')}</p>
						<p class="mt-2">
							{#if pack.credit}{pack.credit.regularAvailable} / {pack.credit.max}{:else}—{/if}
						</p>
					</div>
				</div>
			</div>

			{#if loading}
				<div class="mt-8 min-h-48 animate-pulse border border-border bg-card/40"></div>
			{:else if error || !details}
				<div class="mt-8 border border-destructive/40 p-6 text-sm text-destructive" role="alert">
					{$_('boosters.detail.error')}
				</div>
			{:else}
				<div class="mt-8"><PackPoolBrowser {details} /></div>
			{/if}
		</div>

		<footer
			class="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background/90 px-5 py-4 sm:px-8"
		>
			<p class="text-xs text-muted-foreground">
				{canOpen ? $_('boosters.detail.ready') : $_(`boosters.status.${pack.status}`)}
			</p>
			<Button disabled={!canOpen} onclick={onOpen}>{$_('boosters.open')}</Button>
		</footer>
	</Dialog.Content>
</Dialog.Root>
