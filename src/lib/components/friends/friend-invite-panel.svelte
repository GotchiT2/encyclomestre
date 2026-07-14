<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { User } from '$lib/types';

	let {
		candidates,
		selectedId = $bindable(''),
		onInvite,
		disabled = false
	}: {
		candidates: User[];
		selectedId?: string;
		onInvite: () => void;
		disabled?: boolean;
	} = $props();
</script>

<section
	class="forge-panel grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)_auto] lg:items-end"
>
	<div>
		<p class="forge-label">{$_('friends.invite_title')}</p>
		<p class="mt-2 text-sm text-muted-foreground">{$_('friends.invite_description')}</p>
	</div>
	<label class="grid gap-1.5 text-xs font-bold text-primary uppercase">
		{$_('friends.invite_select')}
		<select bind:value={selectedId} disabled={disabled || !candidates.length}>
			<option value="">{$_('friends.invite_select')}</option>
			{#each candidates as candidate (candidate.id)}
				<option value={candidate.id}>@{candidate.username}</option>
			{/each}
		</select>
	</label>
	<Button disabled={disabled || !selectedId} onclick={onInvite}
		>{$_('friends.invite_action')}</Button
	>
</section>
