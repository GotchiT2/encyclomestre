<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { BoosterFamilyDto } from '$lib/api/boosters';
	import { formatBoosterDelay } from './booster-countdown';
	let { families, now }: { families: BoosterFamilyDto[]; now: number } = $props();
	const unique = $derived([...new Map(families.map((family) => [family.family, family])).values()]);
</script>

<div class="family-credits" aria-label={$_('arcade.sharedCredits')}>
	{#each unique as family (family.family)}<div class="family-credit">
			<div class="family-name">
				{$_('boosters.family.' + family.family, { default: family.family })}<span
					>{$_('opening.sharedReserve')}</span
				>
			</div>
			<div class="credit-numbers">
				{#if Number.isFinite(family.available) && Number.isFinite(family.max)}<strong
						>{family.available}</strong
					><span>/ {family.max}</span>{#if family.bonus}<b>+{family.bonus}</b>{/if}{:else}<span
						>{$_('arcade.noQuantity')}</span
					>{/if}
			</div>
			{#if family.nextAvailableAt && Number.isFinite(Date.parse(family.nextAvailableAt))}<p>
					{$_('boosters.nextCharge')} · {formatBoosterDelay(
						Math.max(0, Date.parse(family.nextAvailableAt) - now)
					)}
				</p>{/if}
		</div>{/each}
</div>

<style>
	.family-credits {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.family-credit {
		display: grid;
		grid-template-columns: auto auto;
		align-items: center;
		gap: 2px 20px;
		border: 1px solid #efebd925;
		padding: 9px 12px;
		background: #1d201a;
	}
	.family-name {
		font-size: 13px;
		font-weight: 600;
	}
	.family-name span {
		display: block;
		font-size: 10px;
		font-weight: 400;
		color: #efebd980;
	}
	.credit-numbers {
		display: flex;
		align-items: baseline;
		gap: 5px;
		font-variant-numeric: tabular-nums;
	}
	strong {
		font:
			700 28px/1 'Barlow Condensed',
			sans-serif;
		color: #e8ef42;
	}
	.credit-numbers span {
		font-size: 12px;
		color: #efebd999;
	}
	b {
		font-size: 13px;
		font-weight: 600;
		color: #e8ef42;
	}
	p {
		grid-column: 1/-1;
		font-size: 10px;
		color: #efebd980;
	}
	@media (max-width: 600px) {
		.family-credit {
			flex: 1 0 98px;
			min-width: 0;
			display: block;
			gap: 2px 6px;
			padding: 6px 8px;
		}
		.family-name {
			font-size: 11px;
		}
		strong {
			font-size: 24px;
		}
		.family-name span {
			display: none;
		}
	}
</style>
