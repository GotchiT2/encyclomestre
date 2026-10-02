<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { BoosterFamilyDto } from '$lib/api/boosters';
	import { formatBoosterDelay } from './booster-countdown';
	let { families, now }: { families: BoosterFamilyDto[]; now: number } = $props();
</script>

<div class="flex gap-3 overflow-x-auto pb-1" aria-label={$_('arcade.sharedCredits')}>
	{#each families as family (family.family)}
		<div class="min-w-44 flex-1 border border-border bg-card px-4 py-3">
			<p class="text-sm font-semibold">{$_('boosters.family.' + family.family)}</p>
			<p class="mt-1 text-2xl tabular-nums">
				{family.available} / {family.max}{#if family.bonus}
					<span class="text-primary">+{family.bonus}</span>{/if}
			</p>
			{#if family.nextAvailableAt && Number.isFinite(Date.parse(family.nextAvailableAt))}<p
					class="mt-1 text-xs text-muted-foreground"
				>
					{$_('boosters.nextCharge')} · {formatBoosterDelay(
						Math.max(0, Date.parse(family.nextAvailableAt) - now)
					)}
				</p>{/if}
		</div>
	{/each}
</div>
<p class="text-xs text-muted-foreground">{$_('arcade.sharedCredits')}</p>
