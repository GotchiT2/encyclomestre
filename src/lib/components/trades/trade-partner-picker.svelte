<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { User } from '$lib/types';

	let {
		open = $bindable(false),
		partners,
		searchPartners,
		onSelect
	}: {
		open?: boolean;
		partners: User[];
		searchPartners?: (query: string) => Promise<User[]>;
		onSelect: (partner: User) => void;
	} = $props();
	let query = $state('');
	let remotePartners = $state<User[]>([]);
	let searchSequence = 0;
	const visiblePartners = $derived(
		[
			...new Map([...partners, ...remotePartners].map((partner) => [partner.id, partner])).values()
		].filter((partner) =>
			`${partner.username} ${partner.displayName}`
				.toLocaleLowerCase('fr-FR')
				.includes(query.trim().toLocaleLowerCase('fr-FR'))
		)
	);

	$effect(() => {
		const text = query.trim();
		if (!searchPartners || text.length < 3) {
			remotePartners = [];
			return;
		}
		const sequence = ++searchSequence;
		const timer = window.setTimeout(async () => {
			const results = await searchPartners(text);
			if (sequence === searchSequence) remotePartners = results;
		}, 500);
		return () => window.clearTimeout(timer);
	});
</script>

<Dialog.Root bind:open
	><Dialog.Portal
		><Dialog.Overlay class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" /><Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[80dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col border-4 border-double border-primary/40 bg-card shadow-2xl"
			><header class="border-b border-primary/20 p-4">
				<Dialog.Title class="font-serif text-2xl font-black uppercase tracking-tight"
					>{$_('trades.choose_partner')}</Dialog.Title
				>
			</header>
			<div class="overflow-y-auto p-4">
				<Input bind:value={query} placeholder={$_('trades.partner_search')} />
				<div class="mt-4 grid gap-2 sm:grid-cols-2">
					{#each visiblePartners as partner (partner.id)}<Button
							variant="outline"
							class="h-auto justify-start p-4 text-left"
							onclick={() => {
								onSelect(partner);
								open = false;
							}}
							><span class="font-serif text-base font-black">@{partner.username}</span><span
								class="font-mono text-[9px] text-primary">{partner.displayName}</span
							></Button
						>{/each}
				</div>
			</div></Dialog.Content
		></Dialog.Portal
	></Dialog.Root
>
