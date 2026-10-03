<script lang="ts">
	import type { WikiForgePublicPageCard } from '$lib/api/pages';
	import VariantCardFace from './variant-card-face.svelte';
	import type { CardRecord, VariantDefinition } from '$lib/types';
	import { _ } from '$lib/i18n';
	let {
		card,
		record,
		onSelect
	}: {
		card: CardRecord;
		record?: WikiForgePublicPageCard;
		onSelect: (variant: VariantDefinition) => void;
	} = $props();
	const variants = $derived(
		record?._variants?.filter((v) => record.variantIds?.includes(v.id)) ?? []
	);
</script>

<section
	data-testid="article-variants"
	class="variant-directory"
	aria-label={$_('completion.availableVariants')}
>
	<h3>{$_('completion.availableVariants')}</h3>
	{#if !record}<p role="status">{$_('completion.loading')}</p>
	{:else if variants.length}
		{#each variants as variant (variant.id)}
			<button
				type="button"
				class:chosen={variant.id === card.variantId}
				aria-pressed={variant.id === card.variantId}
				onclick={() => onSelect(variant)}
			>
				<span class="variant-thumbnail"
					><VariantCardFace
						card={{
							...card,
							variant,
							variantId: variant.id,
							serialNumber: undefined,
							maxCopies: undefined
						}}
					/></span
				>
				<span class="variant-label"
					><strong>{variant.name}</strong><span
						class="variant-rule"
						style={`--variant:${variant.color}`}
						aria-hidden="true"
					></span></span
				>
				<span aria-hidden="true">{variant.id === card.variantId ? '✓' : '↗'}</span>
			</button>
		{/each}
	{:else}<p>{$_('ux.variantsUnavailable')}</p>{/if}
</section>

<style>
	.variant-directory {
		display: grid;
		gap: 6px;
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}
	.variant-directory h3 {
		font-size: 20px;
		margin-bottom: 6px;
	}
	button {
		display: flex;
		gap: 12px;
		align-items: center;
		min-height: 72px;
		text-align: left;
		border: 1px solid var(--border);
		padding: 6px 12px;
		background: var(--background);
		transition:
			border-color 120ms,
			background 120ms;
	}
	button:hover,
	button.chosen {
		border-color: var(--primary);
		background: var(--muted);
	}
	.variant-thumbnail {
		width: 42px;
		flex: none;
	}
	.variant-label {
		min-width: 0;
		flex: 1;
		display: grid;
		gap: 6px;
		overflow-wrap: anywhere;
	}
	.variant-rule {
		display: block;
		width: 28px;
		height: 3px;
		background: var(--variant);
	}
</style>
