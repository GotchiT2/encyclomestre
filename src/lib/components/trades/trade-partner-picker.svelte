<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
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
	let error = $state('');
	let loading = $state(false);
	const visiblePartners = $derived([
		...new Map(
			[
				...remotePartners,
				...partners.filter((partner) =>
					`${partner.username} ${partner.displayName}`
						.toLocaleLowerCase('fr-FR')
						.includes(query.trim().toLocaleLowerCase('fr-FR'))
				)
			].map((partner) => [partner.id, partner])
		).values()
	]);

	$effect(() => {
		const text = query.trim();
		const sequence = ++searchSequence;
		error = '';
		remotePartners = [];
		if (!open || !searchPartners || text.length < 3) {
			loading = false;
			return;
		}
		loading = true;
		const timer = window.setTimeout(async () => {
			try {
				const results = await searchPartners(text);
				if (sequence === searchSequence) remotePartners = results;
			} catch (cause) {
				if (sequence === searchSequence) error = operationError(cause);
			} finally {
				if (sequence === searchSequence) loading = false;
			}
		}, 500);
		return () => {
			window.clearTimeout(timer);
			searchSequence += 1;
		};
	});
</script>

<Dialog.Root bind:open
	><Dialog.Portal
		><Dialog.Overlay class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" /><Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[80dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col border-4 border-double border-primary/40 bg-card shadow-2xl"
			><header class="border-b border-primary/20 p-4">
				<Dialog.Title class="text-2xl font-black uppercase tracking-tight"
					>{$_('trades.choose_partner')}</Dialog.Title
				>
			</header>
			<div class="overflow-y-auto p-4">
				<Input
					bind:value={query}
					aria-label={$_('trades.partner_search')}
					placeholder={$_('trades.partner_search')}
				/>
				{#if error}<p role="alert">{error}</p>{:else if loading}<p role="status">
						{$_('completion.loading')}
					</p>{:else if !visiblePartners.length}<p>{$_('completion.empty')}</p>{/if}
				<div class="mt-4 grid gap-2 sm:grid-cols-2">
					{#each visiblePartners as partner (partner.id)}<Button
							variant="outline"
							aria-label={partner.username}
							class="h-auto justify-start p-4 text-left"
							onclick={() => {
								onSelect(partner);
								open = false;
							}}
							><UserAvatar
								image={partner.avatarUrl}
								crop={partner.imageCrop}
								name={partner.username}
								lastConnection={partner.lastConnection}
							/><span class="min-w-0 flex-1 truncate text-base font-black">@{partner.username}</span
							></Button
						>{/each}
				</div>
			</div></Dialog.Content
		></Dialog.Portal
	></Dialog.Root
>
