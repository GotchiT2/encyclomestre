<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import type { CardRecord, CreateTradeOfferInput, User } from '$lib/types';
	import TradeCardPanel from './trade-card-panel.svelte';
	import TradeModal from './trade-modal.svelte';

	let {
		open = $bindable(false),
		currentUserId,
		partner,
		ownedCards,
		cards,
		draft = $bindable<Partial<CreateTradeOfferInput>>({}),
		onSubmit
	}: {
		open?: boolean;
		currentUserId: string;
		partner: User | null;
		ownedCards: CardRecord[];
		cards: CardRecord[];
		draft?: Partial<CreateTradeOfferInput>;
		onSubmit: (input: CreateTradeOfferInput) => void;
	} = $props();
	let offeredIds = $state<string[]>([]);
	let requestedIds = $state<string[]>([]);
	let offeredCredits = $state(0);
	let requestedCredits = $state(0);
	let error = $state('');
	let activePanel = $state<'you' | 'partner'>('you');
	$effect(() => {
		if (open) {
			offeredIds = draft.offeredCardIds ?? [];
			requestedIds = draft.requestedCardIds ?? [];
			offeredCredits = draft.offeredCredits ?? 0;
			requestedCredits = draft.requestedCredits ?? 0;
			error = '';
		}
	});
	function submit() {
		if (
			!partner ||
			(!offeredIds.length && !offeredCredits) ||
			(!requestedIds.length && !requestedCredits)
		) {
			error = $_('trades.editor_validation');
			return;
		}
		onSubmit({
			initiatorId: currentUserId,
			recipientId: partner.id,
			offeredCardIds: offeredIds,
			requestedCardIds: requestedIds,
			offeredCredits,
			requestedCredits
		});
		open = false;
	}
</script>

<TradeModal bind:open title={$_('trades.editor_title')}>
	<div class="flex min-h-0 flex-1 flex-col">
		<div class="min-h-0 flex-1 overflow-y-auto p-4">
			<nav class="flex border-b border-primary/25" aria-label={$_('trades.editor_tabs')}>
				<Button
					variant={activePanel === 'you' ? 'default' : 'ghost'}
					class="flex-1"
					onclick={() => (activePanel = 'you')}>{$_('trades.my_cards')}</Button
				><Button
					variant={activePanel === 'partner' ? 'default' : 'ghost'}
					class="flex-1"
					onclick={() => (activePanel = 'partner')}>{partner?.username}</Button
				>
			</nav>
			<div class="mt-4">
				{#if activePanel === 'you'}<TradeCardPanel
						title={$_('trades.your_panel')}
						cards={ownedCards}
						bind:selectedIds={offeredIds}
						bind:credits={offeredCredits}
					/>{:else}<TradeCardPanel
						title={$_('trades.partner_panel')}
						{cards}
						ownerName={partner?.username}
						bind:selectedIds={requestedIds}
						bind:credits={requestedCredits}
					/>{/if}
			</div>
			{#if error}<p
					class="mt-4 border border-destructive/50 bg-destructive/10 p-3 font-serif italic text-destructive"
				>
					{error}
				</p>{/if}
		</div>
		<div class="flex shrink-0 justify-end border-t border-primary/25 bg-card px-4 py-3">
			<Button onclick={submit}>{$_('trades.send_offer')}</Button>
		</div>
	</div>
</TradeModal>
