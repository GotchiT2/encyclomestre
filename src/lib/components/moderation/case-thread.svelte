<script lang="ts">
	import type { ModerationCase } from '$lib/api/moderation';
	import { replyModerationCase } from '$lib/api/moderation';
	import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';
	import { operationError } from '$lib/domain/operation-error';
	import { publishRealtimeRefresh } from '$lib/realtime/resource-refresh';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	let { item, onUpdate }: { item: ModerationCase; onUpdate: (item: ModerationCase) => void } =
		$props();
	let content = $state('');
	let busy = $state(false);
	let error = $state('');
	const awaiting = $derived.by(() => {
		let count = 0;
		for (const message of [...item.messages].reverse()) {
			if (message.fromModeration) break;
			count++;
		}
		return count;
	});
	async function send() {
		if (busy || !content.trim() || item.status !== 'OPEN' || awaiting >= 10) return;
		busy = true;
		error = '';
		try {
			const updated = await replyModerationCase(item.id, content);
			onUpdate(updated);
			content = '';
			publishRealtimeRefresh(['moderation']);
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
</script>

<section class="flex flex-col gap-5">
	<header class="flex flex-col gap-2 border-b border-border pb-4">
		<h1 class="font-title text-3xl">{item.subject}</h1>
		<p>{$_('completion.moderation.' + item.status)}</p>
		{#if item.creationDate}<p class="text-sm">
				{$_('completion.moderation.created', {
					values: { date: wikiForgeUtcDate(item.creationDate).toLocaleString('fr-FR') }
				})}
			</p>{/if}{#if item.closedAt}<p class="text-sm">
				{$_('completion.moderation.closedAt', {
					values: { date: wikiForgeUtcDate(item.closedAt).toLocaleString('fr-FR') }
				})}
			</p>{/if}{#if item.sanction}<aside class="border-l-2 border-destructive pl-3">
				<strong>{$_('completion.moderation.' + item.sanction.type)}</strong>
				<p>{item.sanction.reason}</p>
				<p>
					{item.sanction.endsAt
						? wikiForgeUtcDate(item.sanction.endsAt).toLocaleString('fr-FR')
						: $_('completion.moderation.permanent')}
				</p>
			</aside>{/if}
	</header>
	<ol class="case-messages flex flex-col gap-3">
		{#each item.messages as message (message.id)}<li
				class="flex flex-col gap-2 border-l-2 border-border bg-card p-4"
				class:border-primary={message.fromModeration}
			>
				<div class="flex flex-wrap justify-between gap-2 text-sm">
					<strong
						>{$_(
							message.fromModeration ? 'completion.moderation.team' : 'completion.moderation.you'
						)}</strong
					>{#if message.creationDate}<time datetime={message.creationDate}
							>{wikiForgeUtcDate(message.creationDate).toLocaleString('fr-FR')}</time
						>{/if}
				</div>
				<p class="whitespace-pre-wrap break-words">{message.content}</p>
			</li>{/each}
	</ol>
	{#if item.status === 'OPEN'}<form
			class="case-compose flex flex-col gap-3 border-t border-border bg-background pt-4"
			onsubmit={(event) => {
				event.preventDefault();
				void send();
			}}
		>
			<Field.Field
				><Field.FieldLabel for="case-reply">{$_('completion.moderation.reply')}</Field.FieldLabel
				><textarea
					id="case-reply"
					bind:value={content}
					maxlength={2000}
					disabled={busy || awaiting >= 10}
					class="min-h-20 w-full border border-border bg-background p-3"
				></textarea><Field.FieldDescription
					>{$_('completion.moderation.replyHelp')} · {content.length} / 2 000</Field.FieldDescription
				></Field.Field
			>{#if awaiting >= 10}<p role="status">
					{$_('completion.moderation.pending')}
				</p>{/if}{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}<Button
				type="submit"
				disabled={busy || !content.trim() || awaiting >= 10}
				>{$_(busy ? 'completion.busy' : 'completion.guild.send')}</Button
			>
		</form>{:else}<p class="forge-panel p-5">{$_('completion.moderation.closed')}</p>{/if}
</section>

<style>
	.case-messages {
		max-height: 60dvh;
		overflow-y: auto;
	}
	.case-compose {
		position: sticky;
		bottom: 80px;
	}
	@media (min-width: 1024px) {
		.case-compose {
			bottom: 0;
		}
	}
</style>
