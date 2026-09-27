<script lang="ts">
	import LocalDraft from '$lib/components/layout/local-draft.svelte';
	import { draftKey, writeDraft } from '$lib/drafts/storage';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import { activeRestrictions } from '$lib/moderation/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import CoinsIcon from '@lucide/svelte/icons/coins';
	import type {
		CardRecord,
		CreateTradeOfferInput,
		PaginatedResponse,
		TradeCardSearchQuery,
		User
	} from '$lib/types';
	import TradeCardPanel from './trade-card-panel.svelte';
	import TradeModal from './trade-modal.svelte';

	type TradeSide = 'offered' | 'requested';

	let {
		open = $bindable(false),
		currentUserId,
		availableMoney = 0,
		partner,
		initialOwnedCards = [],
		initialPartnerCards = [],
		modalLayer,
		loadOwnedCards,
		loadPartnerCards,
		draft = $bindable<Partial<CreateTradeOfferInput>>({}),
		onSubmit
	}: {
		open?: boolean;
		currentUserId: string;
		availableMoney?: number;
		partner: User | null;
		initialOwnedCards?: CardRecord[];
		initialPartnerCards?: CardRecord[];
		modalLayer?: number;
		loadOwnedCards: (query: TradeCardSearchQuery) => Promise<PaginatedResponse<CardRecord>>;
		loadPartnerCards: (query: TradeCardSearchQuery) => Promise<PaginatedResponse<CardRecord>>;
		draft?: Partial<CreateTradeOfferInput>;
		onSubmit: (input: CreateTradeOfferInput) => void | Promise<void>;
	} = $props();
	let offeredIds = $state<string[]>([]);
	let requestedIds = $state<string[]>([]);
	let message = $state('');
	let offeredMoney = $state(0);
	let requestedMoney = $state(0);
	let error = $state('');
	let submitting = $state(false);
	let activeSide = $state<TradeSide>('offered');
	let termsExpanded = $state(false);
	const offeredMoneyTooHigh = $derived(offeredMoney > availableMoney);
	const partnerName = $derived(partner?.displayName || partner?.username || '');
	$effect(() => {
		if (open) {
			offeredIds = draft.offeredCardIds ?? [];
			requestedIds = draft.requestedCardIds ?? [];
			message = draft.message ?? '';
			offeredMoney = draft.offeredMoney ?? 0;
			requestedMoney = draft.requestedMoney ?? 0;
			error = '';
		}
	});
	async function submit() {
		if (submitting) return;
		if ($activeRestrictions.includes('TRADE')) {
			error = $_('completion.errors.SANCTIONED');
			return;
		}
		if (
			!partner ||
			offeredIds.length > 20 ||
			requestedIds.length > 20 ||
			offeredMoneyTooHigh ||
			(!offeredIds.length && !requestedIds.length && offeredMoney === 0 && requestedMoney === 0)
		) {
			error = $_('trades.editor_validation');
			return;
		}
		submitting = true;
		try {
			await onSubmit({
				initiatorId: currentUserId,
				recipientId: partner.id,
				offeredCardIds: offeredIds,
				requestedCardIds: requestedIds,
				offeredMoney: Math.max(0, Math.trunc(offeredMoney)),
				requestedMoney: Math.max(0, Math.trunc(requestedMoney)),
				message: $activeRestrictions.includes('MUTE') ? '' : message
			});
			writeDraft(localStorage, draftKey(currentUserId, `trade:${partner.id}`), '');
			open = false;
		} catch (cause) {
			error = operationError(cause);
		} finally {
			submitting = false;
		}
	}
</script>

<TradeModal
	bind:open
	{modalLayer}
	title={$_('trades.exchange_with', { values: { user: partnerName } })}
>
	<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<SanctionNotice kind="TRADE" />
		{#if partner && open}<LocalDraft
				target={`trade:${partner.id}`}
				value={JSON.stringify({
					offeredCardIds: offeredIds,
					requestedCardIds: requestedIds,
					message,
					offeredMoney,
					requestedMoney
				})}
				onRestore={(value) => {
					try {
						const parsed = JSON.parse(value);
						if (
							Array.isArray(parsed.offeredCardIds) &&
							Array.isArray(parsed.requestedCardIds) &&
							typeof parsed.message === 'string' &&
							Number.isFinite(parsed.offeredMoney) &&
							Number.isFinite(parsed.requestedMoney)
						) {
							offeredIds = parsed.offeredCardIds
								.filter((id: unknown) => typeof id === 'string')
								.slice(0, 20);
							requestedIds = parsed.requestedCardIds
								.filter((id: unknown) => typeof id === 'string')
								.slice(0, 20);
							message = parsed.message;
							offeredMoney = parsed.offeredMoney;
							requestedMoney = parsed.requestedMoney;
						}
					} catch {
						error = $_('common.error');
					}
				}}
			/>{/if}
		{#if $activeRestrictions.includes('MUTE')}<p class="p-3">
				{$_('completion.moderation.muteTrade')}
			</p>{/if}
		<div
			class="shrink-0 border-b border-primary/20 bg-background/55 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:px-4"
		>
			{$_('trades.selection_summary', {
				values: { offered: offeredIds.length, partner: partnerName, requested: requestedIds.length }
			})}
		</div>
		<nav
			class="grid shrink-0 grid-cols-2 border-b border-primary/25"
			aria-label={$_('trades.editor_tabs')}
		>
			<Button
				variant={activeSide === 'offered' ? 'default' : 'ghost'}
				class="min-w-0 rounded-none py-4 text-xs sm:text-sm"
				aria-selected={activeSide === 'offered'}
				onclick={() => (activeSide = 'offered')}>{$_('trades.my_cards')}</Button
			><Button
				variant={activeSide === 'requested' ? 'default' : 'ghost'}
				class="min-w-0 truncate rounded-none py-4 text-xs sm:text-sm"
				aria-selected={activeSide === 'requested'}
				onclick={() => (activeSide = 'requested')}
				>{$_('trades.partner_cards', { values: { user: partnerName } })}</Button
			>
		</nav>
		<div class="shrink-0 border-b border-primary/20 bg-card/75 px-3 py-2 sm:px-4">
			<Button
				variant="ghost"
				size="sm"
				class="h-8 px-2 text-xs"
				onclick={() => (termsExpanded = !termsExpanded)}
			>
				<CoinsIcon />
				{termsExpanded
					? $_('trades.hide_terms')
					: $_('trades.add_terms', {
							values: { offered: offeredMoney, requested: requestedMoney }
						})}
			</Button>
			{#if termsExpanded}
				<div class="mt-3 grid gap-3 border-t border-primary/15 pt-3 sm:grid-cols-2">
					<label class="font-mono text-[9px] uppercase tracking-widest text-primary">
						{$_('trades.offered_money')}
						<Input
							class="mt-1"
							type="number"
							min="0"
							max={availableMoney}
							step="1"
							bind:value={offeredMoney}
						/>
						<span class="mt-1 block text-[9px] text-muted-foreground">
							{$_('trades.available_money', { values: { amount: availableMoney } })}
						</span>
						{#if offeredMoneyTooHigh}<span class="mt-1 block text-[9px] text-destructive">
								{$_('trades.insufficient_money')}
							</span>{/if}
					</label>
					<label class="font-mono text-[9px] uppercase tracking-widest text-primary">
						{$_('trades.requested_money')}
						<Input class="mt-1" type="number" min="0" step="1" bind:value={requestedMoney} />
					</label>
					<label class="sm:col-span-2 font-mono text-[9px] uppercase tracking-widest text-primary">
						{$_('trades.message')}
						<Input
							class="mt-1 h-10 w-full text-sm normal-case tracking-normal"
							bind:value={message}
							maxlength={512}
							placeholder={$_('trades.message_placeholder')}
						/>
					</label>
				</div>
			{/if}
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3" data-testid="trade-editor-card-selector">
			<div class:hidden={activeSide !== 'offered'}>
				<TradeCardPanel
					title={$_('trades.your_panel')}
					showTitle={false}
					scopeKey={currentUserId}
					active={activeSide === 'offered'}
					initialCards={initialOwnedCards}
					loadCards={loadOwnedCards}
					bind:selectedIds={offeredIds}
				/>
			</div>
			<div class:hidden={activeSide !== 'requested'}>
				<TradeCardPanel
					title={$_('trades.partner_panel')}
					showTitle={false}
					scopeKey={partner?.id ?? 'no-partner'}
					active={activeSide === 'requested'}
					initialCards={initialPartnerCards}
					loadCards={loadPartnerCards}
					bind:selectedIds={requestedIds}
				/>
			</div>
		</div>
		{#if error}<p
				class="shrink-0 border-t border-destructive/40 bg-destructive/10 px-3 py-2 text-sm italic text-destructive sm:px-4"
			>
				{error}
			</p>{/if}
		<footer class="grid shrink-0 grid-cols-2 gap-2 border-t border-primary/25 bg-card p-3 sm:p-4">
			<Button variant="outline" onclick={() => (open = false)}>{$_('common.cancel')}</Button>
			<Button disabled={submitting || $activeRestrictions.includes('TRADE')} onclick={submit}
				>{$_('trades.send_offer')}</Button
			>
		</footer>
	</div>
</TradeModal>
