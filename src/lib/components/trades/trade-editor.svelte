<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import type {
		CardRecord,
		CreateTradeOfferInput,
		PaginatedResponse,
		TradeCardSearchQuery,
		User
	} from '$lib/types';
	import TradeCardPanel from './trade-card-panel.svelte';
	import TradeModal from './trade-modal.svelte';

	let {
		open = $bindable(false),
		currentUserId,
		partner,
		initialOwnedCards = [],
		initialPartnerCards = [],
		loadOwnedCards,
		loadPartnerCards,
		draft = $bindable<Partial<CreateTradeOfferInput>>({}),
		onSubmit
	}: {
		open?: boolean;
		currentUserId: string;
		partner: User | null;
		initialOwnedCards?: CardRecord[];
		initialPartnerCards?: CardRecord[];
		loadOwnedCards: (query: TradeCardSearchQuery) => Promise<PaginatedResponse<CardRecord>>;
		loadPartnerCards: (query: TradeCardSearchQuery) => Promise<PaginatedResponse<CardRecord>>;
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
		<div class="min-h-0 flex-1 overflow-y-auto p-2 sm:p-4">
			<nav class="flex border-b border-primary/25" aria-label={$_('trades.editor_tabs')}>
				<Button
					variant={activePanel === 'you' ? 'default' : 'ghost'}
					class="min-w-0 flex-1 px-2 text-xs sm:text-sm"
					onclick={() => (activePanel = 'you')}>{$_('trades.my_cards')}</Button
				><Button
					variant={activePanel === 'partner' ? 'default' : 'ghost'}
					class="min-w-0 flex-1 truncate px-2 text-xs sm:text-sm"
					onclick={() => (activePanel = 'partner')}
					>{partner?.displayName || partner?.username}</Button
				>
			</nav>
			<div class="mt-3">
				<div class:hidden={activePanel !== 'you'}>
					<TradeCardPanel
						title={$_('trades.your_panel')}
						scopeKey={currentUserId}
						initialCards={initialOwnedCards}
						loadCards={loadOwnedCards}
						bind:selectedIds={offeredIds}
						bind:credits={offeredCredits}
					/>
				</div>
				<div class:hidden={activePanel !== 'partner'}>
					<TradeCardPanel
						title={$_('trades.partner_panel')}
						scopeKey={partner?.id ?? 'no-partner'}
						initialCards={initialPartnerCards}
						loadCards={loadPartnerCards}
						ownerName={partner?.username}
						bind:selectedIds={requestedIds}
						bind:credits={requestedCredits}
					/>
				</div>
			</div>
			{#if error}<p
					class="mt-4 border border-destructive/50 bg-destructive/10 p-3 font-serif italic text-destructive"
				>
					{error}
				</p>{/if}
		</div>
		<div class="flex shrink-0 justify-end border-t border-primary/25 bg-card px-3 py-3 sm:px-4">
			<Button class="w-full sm:w-auto" onclick={submit}>{$_('trades.send_offer')}</Button>
		</div>
	</div>
</TradeModal>
