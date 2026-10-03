<script lang="ts">
	import { tick, untrack, type Snippet } from 'svelte';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import BoosterScene from './booster-scene.svelte';
	import BoosterRevealCard from './booster-reveal-card.svelte';
	import { boosterVisual, openingPageSize } from './booster-visuals';
	import { arcadePreferences, updateArcadePreferences } from '$lib/arcade/preferences';
	import type { CardRecord, PackFamily } from '$lib/types';
	let {
		openedCount,
		creditKnown = true,
		available,
		opening,
		requestPhase = 'verify',
		openingId = 0,
		packName,
		packRenderKey,
		packFamily,
		packCardCount = 5,
		cards,
		error = '',
		suspended = false,
		onOpen,
		onOpenAll = () => undefined,
		canOpenAll = false,
		canOpen = true,
		onReset,
		onOpenCard = () => undefined,
		resume = null,
		onProgress = () => undefined,
		sceneOpen = $bindable(false),
		verification
	}: {
		openedCount?: number;
		creditKnown?: boolean;
		available: number;
		opening: boolean;
		requestPhase?: 'verify' | 'request';
		openingId?: number;
		packName: string;
		packRenderKey?: string;
		packFamily?: PackFamily;
		packCardCount?: number;
		cards: CardRecord[] | null;
		error?: string;
		suspended?: boolean;
		onOpen: () => void;
		onOpenAll?: () => void;
		canOpenAll?: boolean;
		canOpen?: boolean;
		onReset: () => void;
		onOpenCard?: (card: CardRecord) => void;
		resume?: { revealedIds: string[]; page: number } | null;
		onProgress?: (revealedIds: string[], page: number) => void;
		sceneOpen?: boolean;
		verification?: Snippet;
	} = $props();
	let phase = $state<'idle' | 'ceremony' | 'discovery'>('idle');
	let revealedIds = $state<string[]>([]),
		resultPage = $state(0),
		progress = $state(0),
		massReveal = $state(false);
	let handled = -1;
	let confirmBatch = $state(false),
		requested = $state(false);
	let grid = $state<HTMLDivElement>();
	let inspectionOrigin: HTMLElement | null = null;
	$effect(() => {
		if (suspended || !inspectionOrigin) return;
		const origin = inspectionOrigin;
		inspectionOrigin = null;
		void tick().then(() => {
			if (sceneOpen && origin.isConnected) origin.focus({ preventScroll: true });
		});
	});
	const complete = $derived(
		Boolean(cards?.length && revealedIds.length === cards.length && phase === 'discovery')
	);
	const visible = $derived(
		cards?.slice(resultPage * openingPageSize, (resultPage + 1) * openingPageSize) ?? []
	);
	const pages = $derived(Math.ceil((cards?.length ?? 0) / openingPageSize));
	const visual = $derived(boosterVisual(packRenderKey, packFamily));
	$effect(() => {
		const result = cards,
			id = openingId,
			pending = opening;
		if (!result?.length) {
			untrack(() => {
				phase = 'idle';
				if (!pending) requested = false;
			});
			return;
		}
		if (handled === id) return;
		untrack(() => {
			handled = id;
			requested = false;
			progress = 0;
			massReveal = false;
			revealedIds = (resume?.revealedIds ?? []).filter((id) =>
				result.some((card) => card.id === id)
			);
			resultPage = Math.min(resume?.page ?? 0, Math.ceil(result.length / openingPageSize) - 1);
			if ($arcadePreferences.opening === 'express') {
				revealedIds = result.map((card) => card.id);
				massReveal = true;
				phase = 'discovery';
				onProgress(revealedIds, resultPage);
			} else phase = resume ? 'discovery' : 'ceremony';
		});
	});
	function request(all = false) {
		if (opening || requested || !canOpen || !available || !creditKnown || suspended) return;
		requested = true;
		sceneOpen = true;
		if (all) onOpenAll();
		else onOpen();
	}
	function reveal(card: CardRecord) {
		if (suspended || phase !== 'discovery' || revealedIds.includes(card.id)) return;
		revealedIds = [...revealedIds, card.id];
		onProgress(revealedIds, resultPage);
	}
	function all() {
		if (!cards || suspended) return;
		massReveal = true;
		phase = 'discovery';
		revealedIds = cards.map((card) => card.id);
		onProgress(revealedIds, resultPage);
	}
	function movePage(next: number) {
		resultPage = Math.max(0, Math.min(next, pages - 1));
		onProgress(revealedIds, resultPage);
		grid?.scrollTo({ top: 0, behavior: 'instant' });
	}
</script>

<div class="opening-controls" data-testid="booster-stage">
	<div class="opening-mode" aria-label={$_('boosters.quick_mode')}>
		<Button
			variant={$arcadePreferences.opening === 'immersive' ? 'secondary' : 'ghost'}
			aria-pressed={$arcadePreferences.opening === 'immersive'}
			onclick={() => updateArcadePreferences({ opening: 'immersive' })}
			disabled={opening}>{$_('arcade.immersive')}</Button
		><Button
			variant={$arcadePreferences.opening === 'express' ? 'secondary' : 'ghost'}
			aria-pressed={$arcadePreferences.opening === 'express'}
			onclick={() => updateArcadePreferences({ opening: 'express' })}
			disabled={opening}>{$_('arcade.express')}</Button
		>
	</div>
	<div class="open-buttons">
		<Button
			class="open-main"
			data-testid="booster-open-one"
			disabled={opening || requested || !canOpen || !available || !creditKnown}
			onclick={() => request()}
			><span>{opening ? $_('boosters.opening') : $_('boosters.open')}</span><span aria-hidden="true"
				>↗</span
			></Button
		>{#if canOpenAll && available > 1}<Button
				variant="outline"
				disabled={opening || requested || !canOpen || !creditKnown}
				onclick={() => (confirmBatch = true)}>{$_('arcade.batchConfirm')}</Button
			>{/if}
	</div>
	{#if opening && !sceneOpen}<p role="status" class="pending-hint">
			{$_('opening.pending')}
			<Button variant="ghost" onclick={() => (sceneOpen = true)}>{$_('opening.returnScene')}</Button
			>
		</p>{/if}
	{#if error && !sceneOpen}<p role="alert" class="opening-error">{error}</p>{/if}
</div>

<Dialog.Root
	open={sceneOpen}
	onOpenChange={(value) => {
		if (!value && !suspended) {
			sceneOpen = false;
			onReset();
		}
	}}
>
	<Dialog.Content
		fullscreen
		class="booster-theatre p-0 sm:p-0 overflow-hidden"
		showCloseButton={false}
	>
		<Dialog.Header class="theatre-header"
			><div>
				<p class="theatre-overline">{$_('opening.room')}</p>
				<Dialog.Title>{packName}</Dialog.Title><Dialog.Description
					>{cards?.length
						? complete
							? $_('opening.complete')
							: $_('arcade.revealed', {
									values: { count: revealedIds.length, total: cards.length }
								})
						: $_(
								requestPhase === 'verify' ? 'opening.verifying' : 'opening.requesting'
							)}</Dialog.Description
				>
			</div>
			<Button
				variant="ghost"
				aria-label={$_('arcade.leaveDiscovery')}
				onclick={() => {
					sceneOpen = false;
					onReset();
				}}
				disabled={suspended}>{$_('boosters.close')} <span aria-hidden="true">×</span></Button
			></Dialog.Header
		>
		<div class="theatre-main" class:ceremony={phase === 'ceremony'} class:summary={complete}>
			{#if cards?.length && (phase === 'discovery' || progress >= 0.73)}
				<div
					class="discovery-board"
					class:dealing={phase === 'ceremony'}
					class:mass={massReveal}
					bind:this={grid}
					data-testid="discovery-board"
				>
					<div
						class="board-grid"
						style={`--large-cols:${Math.min(visible.length, 8)};--desktop-cols:${Math.min(visible.length, 6)};--tablet-cols:${Math.min(visible.length, 4)};--phone-cols:${Math.min(visible.length, 2)}`}
					>
						{#each visible as card, i (card.id)}<div
								class="board-slot"
								style={`--slot:${i};--flight-x:${((i % 6) - 2.5) * 22}px;--flight-angle:${((i % 5) - 2) * 5}deg`}
							>
								<BoosterRevealCard
									{card}
									{visual}
									revealed={revealedIds.includes(card.id)}
									{massReveal}
									interactive={phase === 'discovery' && !suspended}
									detailsEnabled={!suspended}
									onReveal={() => reveal(card)}
									onOpenDetail={() => {
										inspectionOrigin =
											document.activeElement instanceof HTMLElement ? document.activeElement : null;
										onOpenCard(card);
									}}
								/>
							</div>{/each}
					</div>
				</div>
			{/if}
			{#if phase === 'ceremony' || !cards?.length}<div
					class="theatre-scene"
					class:departing={progress >= 0.73}
				>
					<BoosterScene
						name={packName}
						renderKey={packRenderKey}
						family={packFamily}
						count={packCardCount}
						active={sceneOpen}
						playing={phase === 'ceremony'}
						waiting={!cards?.length && opening}
						onProgress={(value) => (progress = value)}
						onComplete={() => {
							if (phase === 'ceremony') phase = 'discovery';
						}}
					/>
				</div>{/if}
			{#if !cards?.length}<div class="verification-slot">
					{#if opening}<p class="waiting-label" role="status">
							<span></span>{$_(
								requestPhase === 'verify' ? 'opening.verifying' : 'opening.requesting'
							)}
						</p>{/if}{#if verification}{@render verification()}{/if}{#if error}<p
							role="alert"
							class="opening-error"
						>
							{error}
						</p>{/if}
				</div>{/if}
		</div>
		<footer class="theatre-footer">
			{#if phase === 'ceremony'}<p>{$_('opening.sealBroken')}</p>
				<Button variant="outline" onclick={() => (phase = 'discovery')} disabled={suspended}
					>{$_('arcade.skipAnimation')}</Button
				>
			{:else if cards?.length}<div class="board-information">
					{#if complete}<p role="status">{$_('arcade.summary')}</p>
						{#if openedCount != null}<p class="summary-count">
								{$_(creditKnown ? 'plan.boosters.opened' : 'plan.boosters.openedUnknownCredits', {
									values: { count: openedCount, remaining: available }
								})}
							</p>{/if}
						<p>{$_('opening.manageHint')}</p>{:else}<p>{$_('opening.revealHint')}</p>{/if}
				</div>
				<div class="board-commands">
					{#if pages > 1}<div class="board-pagination" aria-label={$_('opening.resultPages')}>
							<Button
								variant="ghost"
								size="icon"
								disabled={!resultPage || suspended}
								onclick={() => movePage(resultPage - 1)}
								aria-label={$_('opening.previousPage')}>←</Button
							><span>{resultPage + 1} / {pages}</span><Button
								variant="ghost"
								size="icon"
								disabled={resultPage === pages - 1 || suspended}
								onclick={() => movePage(resultPage + 1)}
								aria-label={$_('opening.nextPage')}>→</Button
							>
						</div>{/if}{#if !complete}<Button disabled={suspended} onclick={all}
							>{$_('arcade.revealAll')}</Button
						>{:else if canOpen && available && !opening && creditKnown}<Button
							onclick={() => request()}
							disabled={suspended}>{$_('boosters.open_next')}</Button
						>{/if}
				</div>
			{:else}<p>{$_('opening.waitHint')}</p>{/if}
		</footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={confirmBatch}
	><Dialog.Content class="max-w-md p-4 sm:p-5"
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
	.opening-controls {
		display: grid;
		gap: 8px;
		min-width: 0;
	}
	.opening-mode {
		display: flex;
		gap: 4px;
		justify-content: end;
	}
	.open-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	:global(.opening-controls .open-main) {
		min-width: 220px;
		justify-content: space-between;
		gap: 30px;
		min-height: 52px;
	}
	.pending-hint {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		font-size: 12px;
	}
	.opening-error {
		font-size: 14px;
		color: var(--destructive);
	}
	:global(.booster-theatre) {
		border: 0;
		background: #10120f;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	:global(.booster-theatre .theatre-header) {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: max(16px, env(safe-area-inset-top)) clamp(16px, 4vw, 56px) 16px;
		border-bottom: 1px solid #efebd924;
		z-index: 5;
	}
	.theatre-overline {
		font-size: 10px;
		letter-spacing: 0.14em;
		color: #e8ef42;
		text-transform: uppercase;
		margin-bottom: 2px;
	}
	.theatre-main {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		display: grid;
		background: radial-gradient(ellipse at 50% 60%, #e8ef4209, transparent 60%);
	}
	.theatre-scene {
		position: absolute;
		inset: 0;
		transition: opacity 700ms;
	}
	.theatre-scene.departing {
		opacity: 0;
		pointer-events: none;
	}
	.verification-slot {
		z-index: 4;
		align-self: end;
		justify-self: center;
		width: min(100% - 32px, 360px);
		margin-bottom: 16px;
		text-align: center;
	}
	.waiting-label {
		display: flex;
		gap: 8px;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		color: #efebd9a6;
	}
	.waiting-label span {
		width: 6px;
		height: 6px;
		background: #e8ef42;
		border-radius: 50%;
	}
	.discovery-board {
		position: relative;
		padding: clamp(20px, 4vw, 48px);
		overflow-y: auto;
		overscroll-behavior: contain;
		z-index: 3;
		display: grid;
		align-items: center;
		min-height: 0;
	}
	.board-grid {
		display: grid;
		grid-template-columns: repeat(var(--desktop-cols), minmax(0, 144px));
		justify-content: center;
		align-items: start;
		gap: 22px 24px;
	}
	.board-slot {
		width: 100%;
		max-width: 144px;
		justify-self: center;
		min-width: 0;
	}
	.dealing .board-slot {
		animation: cards-deal 800ms cubic-bezier(0.16, 0.74, 0.18, 1) both;
		animation-delay: calc(var(--slot) * 18ms);
	}
	.mass .board-grid {
		animation: acquired 180ms ease-out;
	}
	.theatre-footer {
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 16px clamp(16px, 4vw, 56px) max(16px, env(safe-area-inset-bottom));
		border-top: 1px solid #efebd924;
		background: #171918;
		min-height: 76px;
	}
	.theatre-footer p {
		font-size: 13px;
		color: #efebd9b3;
	}
	.board-information p:last-child {
		font-size: 11px;
	}
	.board-information p:first-child {
		color: #efebd9;
		font-weight: 600;
	}
	.summary-count {
		font-variant-numeric: tabular-nums;
	}
	.board-commands {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
	}
	.board-pagination {
		display: flex;
		gap: 4px;
		align-items: center;
	}
	.board-pagination span {
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}
	@keyframes cards-deal {
		from {
			opacity: 0;
			transform: perspective(600px) translate(var(--flight-x), 100px) rotateZ(var(--flight-angle))
				rotateY(25deg) scale(0.75);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@keyframes acquired {
		from {
			opacity: 0.7;
		}
		to {
			opacity: 1;
		}
	}
	@media (min-width: 1280px) {
		.board-grid {
			grid-template-columns: repeat(var(--large-cols), minmax(0, 144px));
		}
	}
	@media (max-width: 1023px) {
		.board-grid {
			grid-template-columns: repeat(var(--tablet-cols), minmax(0, 144px));
			gap: 22px 18px;
		}
	}
	@media (max-width: 600px) {
		.board-grid {
			grid-template-columns: repeat(var(--phone-cols), minmax(0, 144px));
			gap: 18px 20px;
		}
		.discovery-board {
			padding: 20px 20px 24px;
			align-items: start;
		}
		.opening-mode {
			justify-content: center;
		}
		.open-buttons {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.open-buttons :global(button:only-child) {
			grid-column: 1 / -1;
		}
		.open-buttons :global(button) {
			white-space: normal;
			font-size: 13px;
		}
		:global(.opening-controls .open-main) {
			width: 100%;
			min-width: 0;
		}
		.theatre-footer {
			padding: 12px 16px max(12px, env(safe-area-inset-bottom));
			gap: 8px;
		}
		.board-information {
			width: 100%;
		}
		.board-commands {
			width: 100%;
			justify-content: space-between;
		}
		:global(.booster-theatre .theatre-header) {
			padding-inline: 16px;
		}
		:global(.booster-theatre .theatre-header [data-slot='dialog-title']) {
			font-size: 24px;
			overflow-wrap: anywhere;
		}
	}
	:global(html[data-motion='reduce'] .booster-theatre *) {
		animation: none !important;
		transition: none !important;
	}
	@media (prefers-reduced-motion: reduce) {
		.board-slot,
		.mass .board-grid {
			animation: none !important;
		}
		.theatre-scene {
			transition: none;
		}
	}
</style>
