<script lang="ts">
	import { createSale } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { CardRecord, CreateSaleInput, SaleListing } from '$lib/types';

	let {
		open = $bindable(false),
		copies,
		onCreated
	}: {
		open?: boolean;
		copies: CardRecord[];
		onCreated: (sale: SaleListing, userCardId: string) => void;
	} = $props();

	const durations = [1, 10, 60, 180, 360, 720, 1440] as const;
	let selectedCopyId = $state('');
	let type = $state<CreateSaleInput['type']>('auction');
	let price = $state(10);
	let durationMinutes = $state<CreateSaleInput['durationMinutes']>(60);
	let submitting = $state(false);
	let error = $state(false);
	const validPrice = $derived(Number.isInteger(price) && price >= 1 && price <= 999999);

	$effect(() => {
		if (!open) return;
		selectedCopyId = copies.find((copy) => !copy.activeSale)?.id ?? '';
		price = 10;
		type = 'auction';
		durationMinutes = 60;
		error = false;
	});

	function changeType(value: string | string[]) {
		if (value === 'auction' || value === 'direct') type = value;
	}

	async function submit() {
		if (!selectedCopyId || !validPrice || submitting) return;
		submitting = true;
		error = false;
		try {
			const input: CreateSaleInput = {
				userCardId: selectedCopyId,
				type,
				price,
				...(type === 'auction' ? { durationMinutes } : {})
			};
			const sale = await createSale(input);
			onCreated(sale, selectedCopyId);
			open = false;
		} catch {
			error = true;
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl" data-testid="sale-listing-dialog">
		<Dialog.Header class="border-b border-primary/20 p-5 pr-14">
			<Dialog.Title class="font-serif text-2xl font-bold text-foreground">
				{$_('market.create_sale_title')}
			</Dialog.Title>
			<Dialog.Description class="mt-1 font-serif text-sm italic text-muted-foreground">
				{$_('market.create_sale_description')}
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid max-h-[calc(100dvh-12rem)] gap-5 overflow-y-auto p-5">
			<fieldset class="min-w-0">
				<legend class="forge-label mb-2">{$_('market.copy')}</legend>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each copies as copy (copy.id)}
						<button
							type="button"
							class={cn(
								'min-h-14 min-w-0 border border-primary/30 bg-background/70 p-3 text-left disabled:cursor-not-allowed disabled:opacity-45',
								selectedCopyId === copy.id && 'border-primary bg-primary/10'
							)}
							disabled={Boolean(copy.activeSale)}
							onclick={() => (selectedCopyId = copy.id)}
						>
							<span class="block truncate font-serif text-sm font-bold">{copy.title}</span>
							<span class="mt-1 block font-mono text-[10px] uppercase tracking-widest text-primary">
								{copy.activeSale
									? $_('collection.on_sale')
									: new Date(copy.acquiredAt ?? '').toLocaleDateString('fr-FR')}
							</span>
							{#if copy.collectionTags?.length}
								<span class="mt-2 flex flex-wrap gap-1">
									{#each copy.collectionTags as tag (tag.id)}
										<span
											class="border px-1.5 py-0.5 font-mono text-[9px] uppercase"
											style={`border-color:${tag.color};color:${tag.color}`}
										>
											{tag.name}
										</span>
									{/each}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</fieldset>

			<fieldset>
				<legend class="forge-label mb-2">{$_('market.sale_type')}</legend>
				<ToggleGroup.Root
					type="single"
					value={type}
					onValueChange={changeType}
					variant="outline"
					spacing={1}
					class="grid grid-cols-2"
				>
					<ToggleGroup.Item value="auction" class="min-h-11">
						{$_('market.auction')}
					</ToggleGroup.Item>
					<ToggleGroup.Item value="direct" class="min-h-11">
						{$_('market.showcase_sale')}
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</fieldset>

			<label class="grid gap-2">
				<span class="forge-label">{$_('market.starting_price')}</span>
				<Input
					type="number"
					min="1"
					max="999999"
					step="1"
					bind:value={price}
					aria-invalid={!validPrice}
				/>
				<span class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
					{$_('market.price_limits')}
				</span>
			</label>

			{#if type === 'auction'}
				<label class="grid gap-2">
					<span class="forge-label">{$_('market.duration')}</span>
					<select bind:value={durationMinutes} class="h-11 w-full">
						{#each durations as duration (duration)}
							<option value={duration}>
								{$_('market.duration_minutes', { values: { count: duration } })}
							</option>
						{/each}
					</select>
				</label>
			{/if}

			{#if error}
				<p class="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
					{$_('market.create_sale_error')}
				</p>
			{/if}
		</div>

		<Dialog.Footer class="border-t border-primary/20 p-4">
			<Button variant="outline" onclick={() => (open = false)}>{$_('common.cancel')}</Button>
			<Button disabled={!selectedCopyId || !validPrice || submitting} onclick={() => void submit()}>
				{submitting ? $_('market.creating_sale') : $_('market.confirm_sale')}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
