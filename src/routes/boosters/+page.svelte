<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import { getBoosterInventory, openBooster } from '$lib/api';
	import BoosterReveal from '$lib/components/boosters/booster-reveal.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { BoosterInventory, BoosterOpenResult } from '$lib/types';
	let userId = $state('demo-user');
	let inventory = $state<BoosterInventory | null>(null);
	let result = $state<BoosterOpenResult | null>(null);
	let opening = $state(false);
	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		inventory = await getBoosterInventory(userId);
	});
	async function open() {
		if (!inventory?.available || opening) return;
		opening = true;
		result = await openBooster(userId);
		inventory = result.inventory;
		opening = false;
	}
</script>

<section class="flex flex-col gap-6">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('boosters.eyebrow')}
		</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight sm:text-5xl">
			{$_('boosters.title')}
		</h1>
		<p class="mt-3 font-serif italic text-muted-foreground">{$_('boosters.description')}</p>
	</header>
	{#if inventory}<div class="border-4 border-double border-primary/30 bg-card p-5 text-center">
			<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('boosters.reserve')}
			</p>
			<p class="mt-2 font-serif text-5xl font-black">
				{inventory.available} / {inventory.capacity}
			</p>
			<Button class="mt-5" disabled={!inventory.available || opening} onclick={open}
				>{opening ? $_('boosters.opening') : $_('boosters.open')}</Button
			>
		</div>{/if}{#if result}<BoosterReveal
			{result}
			canOpenNext={Boolean(inventory?.available)}
			onOpenNext={open}
			onClose={() => (result = null)}
		/>{/if}
</section>
