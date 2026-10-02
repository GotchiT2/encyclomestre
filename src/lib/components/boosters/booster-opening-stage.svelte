<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import BoosterPackArt from './booster-pack-art.svelte';
	import PackScene from '$lib/card-renderer/pack-scene.svelte';
	import BoosterRevealCard from './booster-reveal-card.svelte';
	import CardTile from '$lib/components/card-tile.svelte';
	import { arcadePreferences, updateArcadePreferences } from '$lib/arcade/preferences';
	import type { CardRecord } from '$lib/types';
	let {
		showPack = true,
		openedCount,
		creditKnown = true,
		available,
		regularAvailable = available,
		bonusAvailable = 0,
		maximum,
		nextDelay,
		opening,
		openingId = 0,
		packName,
		packImage,
		packRenderKey = 'standard',
		packCardCount = 5,
		cards,
		error = false,
		suspended = false,
		onOpen,
		onOpenAll = () => undefined,
		canOpenAll = false,
		canOpen = true,
		onReset,
		onOpenCard = () => undefined,
		resume = null,
		onProgress = () => undefined
	}: {
		showPack?: boolean;
		openedCount?: number;
		creditKnown?: boolean;
		available: number;
		regularAvailable?: number;
		bonusAvailable?: number;
		maximum: number;
		nextDelay?: string;
		opening: boolean;
		openingId?: number;
		packName: string;
		packImage: string;
		packRenderKey?: string;
		packCardCount?: number;
		cards: CardRecord[] | null;
		error?: boolean;
		suspended?: boolean;
		onOpen: () => void;
		onOpenAll?: () => void;
		canOpenAll?: boolean;
		canOpen?: boolean;
		onReset: () => void;
		onOpenCard?: (card: CardRecord) => void;
		resume?: { revealed: number; index: number } | null;
		onProgress?: (revealed: number, index: number) => void;
	} = $props();
	let phase = $state<'idle' | 'dealing' | 'revealing' | 'complete'>('idle');
	let revealed = $state(0),
		index = $state(0),
		handled = -1;
	let confirmBatch = $state(false),
		startX: number | null = null,
		startY: number | null = null;
	let requested = $state(false),
		dealTimer: ReturnType<typeof setTimeout> | undefined;
	const reduced = () =>
		$arcadePreferences.motion === 'reduce' ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	$effect(() => {
		const id = openingId,
			result = cards;
		if (!result?.length) {
			clearTimeout(dealTimer);
			phase = 'idle';
			if (!opening) requested = false;
			return;
		}
		if (handled === id) return;
		untrack(() => {
			clearTimeout(dealTimer);
			handled = id;
			requested = false;
			revealed = Math.min(resume?.revealed ?? 0, result.length);
			index = Math.min(resume?.index ?? 0, result.length - 1);
			if ($arcadePreferences.opening === 'express') {
				revealed = result.length;
				phase = 'complete';
				onProgress(revealed, index);
			} else if (resume) phase = revealed === result.length ? 'complete' : 'revealing';
			else {
				phase = 'dealing';
				if (reduced()) dealTimer = setTimeout(() => (phase = 'revealing'), 0);
			}
		});
	});
	onDestroy(() => clearTimeout(dealTimer));
	function request(all = false) {
		if (opening || requested || !canOpen || !available || suspended) return;
		requested = true;
		if (all) onOpenAll();
		else onOpen();
	}
	function discover() {
		if (suspended || phase !== 'revealing' || !cards) return;
		if (index < revealed - 1) index++;
		else {
			index = revealed;
			revealed = Math.min(revealed + 1, cards.length);
		}
		onProgress(revealed, index);
	}
	function revealAll() {
		if (!cards || suspended) return;
		clearTimeout(dealTimer);
		revealed = cards.length;
		phase = 'complete';
		onProgress(revealed, index);
	}
	function previous() {
		index = Math.max(0, index - 1);
		onProgress(revealed, index);
	}
	function tear(event: PointerEvent) {
		if (
			startX != null &&
			startY != null &&
			Math.abs(event.clientX - startX) >= 70 &&
			Math.abs(event.clientY - startY) < 90
		)
			request();
		startX = startY = null;
	}
</script>

<div class="opening-controls" data-testid="booster-stage">
	<div class="opening-settings">
		<div>
			{#if creditKnown && showPack}<p class="text-sm font-semibold">
					{$_('boosters.reserve')}
					<span class="tabular-nums"
						>{regularAvailable} / {maximum}{#if bonusAvailable}
							+{bonusAvailable}{/if}</span
					>
				</p>
				{#if nextDelay}<p class="text-xs text-muted-foreground">
						{$_('boosters.nextCharge')} · {nextDelay}
					</p>{/if}{:else if !creditKnown}<p class="text-sm">{$_('arcade.noQuantity')}</p>{/if}
		</div>
		<div class="flex gap-1" aria-label={$_('boosters.quick_mode')}>
			<Button
				aria-pressed={$arcadePreferences.opening === 'immersive'}
				variant={$arcadePreferences.opening === 'immersive' ? 'default' : 'outline'}
				onclick={() => updateArcadePreferences({ opening: 'immersive' })}
				>{$_('arcade.immersive')}</Button
			><Button
				aria-pressed={$arcadePreferences.opening === 'express'}
				variant={$arcadePreferences.opening === 'express' ? 'default' : 'outline'}
				onclick={() => updateArcadePreferences({ opening: 'express' })}
				>{$_('arcade.express')}</Button
			>
		</div>
	</div>
	{#if !cards?.length}<div class="sealed-pack">
			{#if showPack}<div
					class="pack-object"
					class:waiting={opening}
					onpointerdown={(event) => {
						startX = event.clientX;
						startY = event.clientY;
					}}
					onpointerup={tear}
					onpointercancel={() => {
						startX = startY = null;
					}}
					role="presentation"
				>
					<BoosterPackArt
						name={packName}
						renderKey={packRenderKey}
						cardCount={packCardCount}
						imageUrl={packImage}
					/>
				</div>{/if}
			{#if !showPack && !opening}<div
					class="pack-tear-handle"
					data-testid="pack-tear-handle"
					role="presentation"
					onpointerdown={(event) => {
						startX = event.clientX;
						startY = event.clientY;
					}}
					onpointerup={tear}
					onpointercancel={() => {
						startX = startY = null;
					}}
				>
					<span aria-hidden="true">→ ····················· →</span><span
						>{$_('arcade.tearStrip')}</span
					>
				</div>{/if}
			<p class="text-sm text-muted-foreground" role="status">
				{opening
					? $_('arcade.openingWait')
					: error
						? $_('boosters.opening_error')
						: $_('arcade.tearHint')}
			</p>
			<Button
				data-testid="booster-open-one"
				class="min-h-12 w-full max-w-xs"
				disabled={opening || requested || !canOpen || !available}
				onclick={() => request()}>{opening ? $_('boosters.opening') : $_('boosters.open')}</Button
			>
			{#if canOpenAll && available > 1}<Button
					variant="outline"
					disabled={opening || requested || !canOpen}
					onclick={() => (confirmBatch = true)}>{$_('arcade.batchConfirm')}</Button
				>{/if}
		</div>{/if}
</div>
<Dialog.Root
	open={Boolean(cards?.length)}
	onOpenChange={(value) => {
		if (!value && !suspended) onReset();
	}}
>
	<Dialog.Content class="arcade-opening-dialog max-w-6xl" showCloseButton={false}>
		<Dialog.Header class="opening-head"
			><div>
				<Dialog.Title>{packName}</Dialog.Title><Dialog.Description
					>{phase === 'complete'
						? $_('arcade.summary')
						: $_('arcade.revealed', {
								values: { count: revealed, total: cards?.length ?? 0 }
							})}</Dialog.Description
				>
			</div>
			<Button variant="ghost" onclick={onReset}>{$_('arcade.leaveDiscovery')}</Button
			></Dialog.Header
		>
		{#if phase !== 'complete'}<div class="opening-command">
				<Button onclick={revealAll} disabled={suspended}>{$_('arcade.revealAll')}</Button>
			</div>{/if}
		{#if phase === 'dealing'}<div class="ceremony-stage">
				<Button
					variant="outline"
					class="ceremony-skip"
					onclick={() => {
						clearTimeout(dealTimer);
						phase = 'revealing';
					}}>{$_('arcade.skipAnimation')}</Button
				>
				<PackScene
					name={packName}
					image={packImage}
					brand={$_('navigation.brand')}
					cardCount={packCardCount}
					cardsLabel={$_('arcade.cardsLabel')}
					playing
					onComplete={() => {
						if (phase === 'dealing') {
							clearTimeout(dealTimer);
							phase = 'revealing';
						}
					}}
				/>
			</div>
		{:else if phase === 'revealing' && cards?.[index]}<div
				class="discovery-stage"
				onpointerdown={(event) => (startX = event.clientX)}
				onpointerup={(event) => {
					if (startX != null && startX - event.clientX > 70) discover();
					startX = null;
				}}
				role="presentation"
			>
				<div class="discovery-card">
					{#key index}<BoosterRevealCard
							card={cards[index]}
							revealed={index < revealed}
							interactive={!suspended}
							detailsEnabled={!suspended}
							onReveal={discover}
							onOpenDetail={() => onOpenCard(cards![index])}
						/>{/key}
				</div>
				<div class="discovery-navigation">
					<Button variant="outline" disabled={index === 0 || suspended} onclick={previous}
						>{$_('arcade.previousCard')}</Button
					><Button
						disabled={suspended}
						onclick={() => {
							if (revealed === cards!.length && index === revealed - 1) phase = 'complete';
							else discover();
						}}
						>{revealed === cards.length && index === revealed - 1
							? $_('boosters.show_summary')
							: $_('arcade.nextCard')}</Button
					>
				</div>
			</div>
		{:else if phase === 'complete' && cards}<div class="opening-summary arcade-card-grid">
				{#each cards as card (card.id)}<CardTile {card} owned onOpen={onOpenCard} />{/each}
			</div>
			<div class="opening-footer">
				{#if openedCount != null}<p class="w-full text-center text-sm" role="status">
						{$_(creditKnown ? 'plan.boosters.opened' : 'plan.boosters.openedUnknownCredits', {
							values: { count: openedCount, remaining: available }
						})}
					</p>{/if}<Button variant="outline" onclick={onReset}>{$_('boosters.close')}</Button
				>{#if available && canOpen}<Button
						onclick={() => {
							onReset();
							request();
						}}>{$_('boosters.open_next')}</Button
					>{/if}
			</div>{/if}
	</Dialog.Content>
</Dialog.Root>
<Dialog.Root bind:open={confirmBatch}
	><Dialog.Content class="max-w-md p-5"
		><Dialog.Header
			><Dialog.Title>{$_('arcade.batchConfirm')}</Dialog.Title><Dialog.Description
				>{$_('arcade.batchHint')}</Dialog.Description
			></Dialog.Header
		><Dialog.Footer
			><Button variant="outline" onclick={() => (confirmBatch = false)}
				>{$_('common.cancel')}</Button
			><Button
				onclick={() => {
					confirmBatch = false;
					request(true);
				}}>{$_('completion.confirm')}</Button
			></Dialog.Footer
		></Dialog.Content
	></Dialog.Root
>

<style>
	.ceremony-stage {
		position: relative;
		flex: 1;
		display: grid;
		align-content: center;
		min-height: 0;
	}
	:global(.ceremony-skip) {
		justify-self: center;
	}
	.pack-tear-handle {
		display: grid;
		gap: 0.25rem;
		place-items: center;
		min-height: 44px;
		width: 100%;
		max-width: 320px;
		touch-action: pan-y;
		border-block: 1px dashed var(--primary);
		color: var(--primary);
		font-size: 0.875rem;
		user-select: none;
	}
	.opening-controls {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}
	.opening-settings {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: space-between;
		align-items: center;
	}
	.sealed-pack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding: 0;
	}
	.pack-object {
		width: min(58vw, 240px);
		touch-action: pan-y;
	}
	.waiting {
		opacity: 0.7;
	}
	:global(.arcade-opening-dialog .opening-head) {
		display: flex;
		flex-direction: row;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
	}
	.opening-command {
		display: flex;
		justify-content: flex-end;
		padding: 0 1rem;
	}
	.discovery-stage {
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		overflow: auto;
		padding: 0.5rem 1rem 1rem;
		touch-action: pan-y;
	}
	.discovery-card {
		width: min(144px, calc((100dvh - 18rem) * 0.706));
		min-width: 100px;
	}
	.discovery-navigation {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}
	.opening-summary {
		overflow-y: auto;
		min-height: 0;
		padding: 1rem;
		align-items: start;
	}
	.opening-footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 1rem;
		border-top: 1px solid var(--border);
		justify-content: center;
	}
	:global(.arcade-opening-dialog) {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: min(90dvh, 900px);
		max-height: 90dvh;
	}
	@media (max-width: 767px) {
		:global(.arcade-opening-dialog) {
			inset: 0;
			transform: none;
			translate: none;
			width: 100%;
			height: 100dvh;
			max-height: 100dvh;
			border: 0;
		}
		:global(.arcade-opening-dialog .opening-head) {
			padding-top: max(1rem, env(safe-area-inset-top));
		}
		.opening-footer {
			padding-bottom: max(1rem, env(safe-area-inset-bottom));
		}
	}
	@media (max-width: 1023px) {
		.sealed-pack :global([data-testid='booster-open-one']) {
			position: fixed;
			bottom: calc(72px + env(safe-area-inset-bottom));
			left: 12px;
			width: calc(100% - 24px);
			max-width: none;
			z-index: 39;
			box-shadow: 0 -8px 24px var(--background);
		}
	}
</style>
