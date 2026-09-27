<script lang="ts">
	import { untrack } from 'svelte';
	import { createGuild, editGuild, type Guild } from '$lib/api/guilds';
	import ArticlePicker from '$lib/components/selectors/article-picker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Field from '$lib/components/ui/field';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let { guild, onSaved }: { guild?: Guild; onSaved: (guild: Guild) => void } = $props();
	let name = $state(untrack(() => guild?.name ?? ''));
	let joinPolicy = $state<'PUBLIC' | 'INVITE'>(untrack(() => guild?.joinPolicy ?? 'INVITE'));
	let imagePageId = $state<number | undefined>(untrack(() => guild?.imagePageId));
	let busy = $state(false);
	let error = $state('');
	async function save() {
		if (busy || !name.trim() || name.length > 64) return;
		busy = true;
		error = '';
		try {
			const body = { name: name.trim(), joinPolicy, ...(imagePageId ? { imagePageId } : {}) };
			onSaved(guild ? await editGuild(guild.id, body) : await createGuild(body));
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
</script>

<form
	class="forge-panel flex flex-col gap-5 p-5"
	onsubmit={(event) => {
		event.preventDefault();
		void save();
	}}
>
	<h2 class="font-heading text-xl">
		{$_(guild ? 'completion.guild.edit' : 'completion.guild.create')}
	</h2>
	{#if !guild}<p class="text-sm text-muted-foreground">{$_('completion.guild.createHelp')}</p>{/if}
	<Field.FieldGroup
		><Field.Field
			><Field.FieldLabel for="guild-name">{$_('completion.name')}</Field.FieldLabel><Input
				id="guild-name"
				bind:value={name}
				maxlength={64}
				required
			/></Field.Field
		>
		<Field.Field
			><Field.FieldLabel for="guild-policy">{$_('completion.guild.policy')}</Field.FieldLabel
			><select
				id="guild-policy"
				bind:value={joinPolicy}
				class="min-h-11 border border-border bg-background p-2"
				><option value="PUBLIC">{$_('completion.guild.PUBLIC')}</option><option value="INVITE"
					>{$_('completion.guild.INVITE')}</option
				></select
			></Field.Field
		><ArticlePicker bind:value={imagePageId} /></Field.FieldGroup
	>
	{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}<Button
		type="submit"
		disabled={busy || !name.trim()}>{$_(busy ? 'completion.busy' : 'completion.save')}</Button
	>
</form>
