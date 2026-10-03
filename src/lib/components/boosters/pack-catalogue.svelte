<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import type { PackCatalogueItem } from '$lib/types';
	import BoosterPackArt from './booster-pack-art.svelte';
	import { packNameKey } from './pack-labels';
	let {
		packs,
		onDetails,
		onOpen
	}: {
		packs: PackCatalogueItem[];
		onDetails: (pack: PackCatalogueItem) => void;
		onOpen: (pack: PackCatalogueItem) => void;
	} = $props();
	const canOpen = (pack: PackCatalogueItem) =>
		pack.status === 'OPEN' && Boolean(pack.credit?.available);
	const groups = $derived([
		{ key: 'available', label: 'opening.availablePacks', packs: packs.filter(canOpen) },
		{ key: 'other', label: 'opening.otherPacks', packs: packs.filter((pack) => !canOpen(pack)) }
	]);
	const name = (pack: PackCatalogueItem) => {
		const key = packNameKey(pack.name);
		return key ? $_(key) : pack.name;
	};
</script>

{#if !packs.length}<p>{$_('opening.empty')}</p>{/if}
{#each groups as group (group.key)}
	{#if group.packs.length}<section class="pack-group">
			<h2>{$_(group.label)}</h2>
			{#each group.packs as pack (pack.id)}<article class="pack-row">
					<div class="pack-art">
						<BoosterPackArt
							name={name(pack)}
							renderKey={pack.renderKey}
							family={pack.family}
							cardCount={pack.nbCards}
						/>
					</div>
					<div class="pack-description">
						<h3>{name(pack)}</h3>
						<p>
							{$_('boosters.family.' + pack.family, { default: pack.family })} · {$_(
								'boosters.pack_card_count',
								{ values: { count: pack.nbCards } }
							)}
						</p>
						{#if !canOpen(pack)}<span
								>{$_(
									pack.status === 'OPEN'
										? 'boosters.no_credit'
										: `boosters.catalogue.status.${pack.status}`,
									{ default: pack.status }
								)}</span
							>{/if}
					</div>
					<div class="pack-actions">
						<Button variant="ghost" onclick={() => onDetails(pack)}>{$_('opening.contents')}</Button
						>
						{#if canOpen(pack)}<Button variant="outline" onclick={() => onOpen(pack)}
								>{$_('opening.selectPack')}</Button
							>{/if}
					</div>
				</article>{/each}
		</section>{/if}
{/each}

<style>
	.pack-group {
		display: grid;
		gap: 10px;
	}
	h2 {
		font:
			700 24px/1.1 'Barlow Condensed',
			sans-serif;
	}
	.pack-row {
		display: grid;
		grid-template-columns: 52px minmax(0, 1fr) auto;
		gap: 14px;
		align-items: center;
		padding: 12px;
		border: 1px solid var(--border);
		background: #1b1e18;
	}
	.pack-art {
		width: 52px;
	}
	h3 {
		font:
			700 22px/1.1 'Barlow Condensed',
			sans-serif;
		overflow-wrap: anywhere;
	}
	p,
	span {
		font-size: 12px;
		color: var(--muted-foreground);
	}
	.pack-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	@media (max-width: 600px) {
		.pack-row {
			grid-template-columns: 44px minmax(0, 1fr);
			gap: 10px;
		}
		.pack-art {
			width: 44px;
		}
		.pack-actions {
			grid-column: 1/-1;
		}
	}
</style>
