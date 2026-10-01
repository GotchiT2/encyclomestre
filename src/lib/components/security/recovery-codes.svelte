<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	let { codes, onDone }: { codes: string[]; onDone: () => void | Promise<void> } = $props();
	let saved = $state(false);
	let copied = $state(false);
	let failed = $state(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(codes.join('\n'));
			copied = true;
			failed = false;
		} catch {
			failed = true;
		}
	}
	function download() {
		const url = URL.createObjectURL(new Blob([codes.join('\n')], { type: 'text/plain' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'wikiforge-recovery-codes.txt';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<section class="space-y-4">
	<h2 class="text-xl font-semibold">{$_('plan.account.codesTitle')}</h2>
	<p class="text-sm text-muted-foreground">{$_('plan.account.codesInfo')}</p>
	<ul class="grid grid-cols-1 gap-2 rounded border p-3 font-mono text-sm sm:grid-cols-2">
		{#each codes as code (code)}<li class="select-all break-all">{code}</li>{/each}
	</ul>
	<div class="flex flex-wrap gap-2">
		<Button variant="outline" onclick={copy}
			>{$_(copied ? 'plan.account.copied' : 'plan.account.copy')}</Button
		><Button variant="outline" onclick={download}>{$_('plan.account.download')}</Button>
	</div>
	{#if failed}<p role="alert" class="text-sm">{$_('plan.account.copyFailed')}</p>{/if}
	<label class="flex items-start gap-2 text-sm"
		><input class="mt-1" type="checkbox" bind:checked={saved} />{$_('plan.account.saved')}</label
	>
	<Button disabled={!saved} onclick={onDone}>{$_('plan.account.continue')}</Button>
</section>
