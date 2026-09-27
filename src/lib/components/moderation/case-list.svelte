<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ModerationCase } from '$lib/api/moderation';
	import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';
	import { _ } from '$lib/i18n';
	import { Badge } from '$lib/components/ui/badge';
	let { cases }: { cases: ModerationCase[] } = $props();
</script>

<div class="flex flex-col gap-3">
	{#each cases as item (item.id)}<a
			href={resolve('/moderation/[id]', { id: String(item.id) })}
			class="forge-panel flex flex-wrap items-center justify-between gap-4 p-5"
			><div class="flex min-w-0 flex-col gap-2">
				<h2 class="break-words font-heading text-xl">{item.subject}</h2>
				{#if item.lastMessageAt}<p class="text-sm text-muted-foreground">
						{$_('completion.moderation.updated', {
							values: { date: wikiForgeUtcDate(item.lastMessageAt).toLocaleString('fr-FR') }
						})}
					</p>{/if}{#if item.sanction}<p>
						{$_('completion.moderation.' + item.sanction.type)} · {item.sanction.reason}
					</p>{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				<Badge variant="outline">{$_('completion.moderation.' + item.status)}</Badge
				>{#if item.unread}<Badge
						>{$_('completion.moderation.unread', { values: { count: item.unread } })}</Badge
					>{/if}
			</div></a
		>{:else}<p class="forge-panel p-5">{$_('completion.moderation.noCases')}</p>{/each}
</div>
