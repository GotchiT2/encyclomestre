<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import type { CardRecord } from '$lib/types';
	let {
		offered,
		requested,
		offeredMoney,
		requestedMoney,
		message
	}: {
		offered: CardRecord[];
		requested: CardRecord[];
		offeredMoney: number;
		requestedMoney: number;
		message: string;
	} = $props();
</script>

<div class="trade-review">
	{#each [{ cards: offered, money: offeredMoney, label: 'arcade.iGive' }, { cards: requested, money: requestedMoney, label: 'arcade.iReceive' }] as side (side.label)}
		<section>
			<h3 class="text-2xl">{$_(side.label)} · {side.cards.length}</h3>
			{#if side.money > 0}<p class="my-3">
					{$_('achievements.reward_money', { values: { amount: side.money } })}
				</p>{/if}
			<div class="review-grid">
				{#each side.cards as card (card.id)}<CardTile
						{card}
						interactive={false}
						showFriendOwners={false}
					/>{/each}
			</div>
		</section>
	{/each}
	{#if message}<p class="review-message">{message}</p>{/if}
</div>

<style>
	.trade-review {
		min-height: 0;
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: grid;
		gap: 24px;
	}
	.review-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(136px, 100%), 1fr));
		gap: 12px;
		margin-top: 12px;
	}
	.review-message {
		grid-column: 1/-1;
		white-space: pre-wrap;
	}
	@media (min-width: 1024px) {
		.trade-review {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
