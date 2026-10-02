<script lang="ts">
	import { untrack } from 'svelte';
	import { _ } from '$lib/i18n';
	import { reportContent, type ReportInput } from '$lib/api/reports';
	import { blockUser } from '$lib/api/users';
	import { currentSession } from '$lib/auth/session';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Field from '$lib/components/ui/field';
	import ConfirmAction from '$lib/components/layout/confirm-action.svelte';
	import { operationError } from '$lib/domain/operation-error';
	import { publishRealtimeRefresh } from '$lib/realtime/resource-refresh';
	import { toast } from 'svelte-sonner';
	let {
		pageId,
		title,
		target,
		userId
	}: {
		pageId?: number;
		title: string;
		target?: { type: ReportInput['type']; id: number };
		userId?: number;
	} = $props();
	const subject = $derived(target ?? { type: 'PAGE' as const, id: pageId! });
	const self = $derived(subject.type === 'USER' && String(subject.id) === $currentSession?.user.id);
	const reasons: ReportInput['reason'][] = [
		'CHEATING',
		'NAME',
		'HARASSMENT',
		'SPAM',
		'INAPPROPRIATE',
		'OTHER'
	];
	let reason = $state<ReportInput['reason']>(
		untrack(() => (subject.type === 'PAGE' ? 'INAPPROPRIATE' : 'OTHER'))
	);
	let open = $state(false);
	let comment = $state('');
	let busy = $state(false);
	let error = $state('');
	let sent = $state(false);
	let blocked = $state(false);
	async function submit() {
		if (busy || sent || !subject.id) return;
		busy = true;
		error = '';
		try {
			await reportContent({
				...subject,
				reason,
				...(comment.trim() ? { comment: comment.trim() } : {})
			});
			sent = true;
			open = false;
			toast.success($_('completion.report.sent'));
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
	async function block() {
		if (!userId) return;
		await blockUser(String(userId));
		blocked = true;
		publishRealtimeRefresh(['friends', 'trades', 'messages', 'profile', 'guild']);
		toast.success($_('completion.report.blocked'));
	}
</script>

{#if !self && subject.id}
	<Button variant="outline" disabled={sent} onclick={() => (open = true)}
		>{sent
			? $_('completion.report.sent')
			: `${$_('completion.report.action')} · ${$_('completion.report.' + subject.type)}`}</Button
	>
	{#if sent && userId && String(userId) !== $currentSession?.user.id && !blocked}<ConfirmAction
			label={$_('completion.report.block')}
			description={$_('completion.report.blockHelp')}
			onConfirm={block}
		/>{/if}
	<Dialog.Root bind:open
		><Dialog.Content
			class="max-w-lg overflow-y-auto p-4 sm:p-5"
			onInteractOutside={(event) => {
				if (busy) event.preventDefault();
			}}
			onEscapeKeydown={(event) => {
				if (busy) event.preventDefault();
			}}
		>
			<Dialog.Title>{$_('completion.report.title')}</Dialog.Title><Dialog.Description
				>{$_('completion.report.' + subject.type)} · {$_('completion.report.target', {
					values: { name: title }
				})}</Dialog.Description
			>
			<p class="text-sm text-muted-foreground">{$_('completion.report.help')}</p>
			<Field.FieldGroup
				><Field.Field
					><Field.FieldLabel for="report-reason">{$_('completion.report.reason')}</Field.FieldLabel
					><select
						id="report-reason"
						bind:value={reason}
						class="min-h-11 w-full border border-border bg-background p-2"
						>{#each reasons as value (value)}<option {value}
								>{$_('completion.report.' + value)}</option
							>{/each}</select
					></Field.Field
				><Field.Field
					><Field.FieldLabel for="report-comment">{$_('completion.comment')}</Field.FieldLabel
					><textarea
						id="report-comment"
						bind:value={comment}
						maxlength={1000}
						class="min-h-28 w-full border border-border bg-background p-3"
					></textarea><Field.FieldDescription>{comment.length} / 1 000</Field.FieldDescription
					></Field.Field
				></Field.FieldGroup
			>
			{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}
			<Dialog.Footer
				><Button variant="outline" disabled={busy} onclick={() => (open = false)}
					>{$_('completion.cancel')}</Button
				><Button disabled={busy} onclick={() => void submit()}
					>{$_(busy ? 'completion.busy' : 'completion.confirm')}</Button
				></Dialog.Footer
			>
		</Dialog.Content></Dialog.Root
	>
{/if}
