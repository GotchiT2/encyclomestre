<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Input } from '$lib/components/ui/input';
	let { code = $bindable(''), disabled = false }: { code?: string; disabled?: boolean } = $props();
	let useCode = $state(false);
	$effect(() => {
		if (!useCode) code = '';
	});
</script>

<div class="space-y-2">
	<p class="text-sm text-muted-foreground">{$_('plan.account.reauth')}</p>
	<label class="flex items-center gap-2 text-sm"
		><input type="checkbox" bind:checked={useCode} {disabled} />{$_('plan.account.useCode')}</label
	>
	{#if useCode}<label class="block space-y-1"
			><span class="text-sm">{$_('plan.account.code')}</span><Input
				type="password"
				autocomplete="off"
				bind:value={code}
				required
				{disabled}
			/></label
		>{/if}
</div>
