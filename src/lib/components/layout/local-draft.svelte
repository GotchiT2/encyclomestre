<script lang="ts">
	import { untrack } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import { draftKey, readDraft, writeDraft } from '$lib/drafts/storage';
	import ConfirmAction from './confirm-action.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	let {
		target,
		value,
		onRestore
	}: { target: string; value: string; onRestore: (value: string) => void } = $props();
	let enabled = $state(false);
	let saved = $state<string | null>(null);
	const key = $derived(draftKey($currentSession?.user.id ?? 'anonymous', target));
	$effect(() => {
		const id = key;
		untrack(() => {
			saved = readDraft(localStorage, id);
			enabled = saved != null;
		});
	});
	$effect(() => {
		const id = key,
			current = value;
		if (!enabled || saved !== null || !$currentSession) return;
		writeDraft(localStorage, id, current);
	});
	function discard() {
		writeDraft(localStorage, key, '');
		saved = null;
		enabled = false;
	}
</script>

<div
	class="draft-option flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs"
	data-testid="local-draft"
>
	<label class="flex min-h-11 cursor-pointer items-center gap-2 leading-normal"
		><input
			type="checkbox"
			class="size-4 shrink-0 accent-primary"
			bind:checked={enabled}
			onchange={(event) => {
				if (!event.currentTarget.checked) discard();
			}}
		/><span>{$_('controls.saveDraft')}</span></label
	>
	{#if saved !== null}<ConfirmAction
			label={$_('ux.draftRestore')}
			description={$_('ux.draftConfirm')}
			onConfirm={async () => {
				if (saved !== null) onRestore(saved);
				saved = null;
			}}
		/><Button variant="ghost" onclick={discard}>{$_('ux.draftDiscard')}</Button>{/if}
</div>
