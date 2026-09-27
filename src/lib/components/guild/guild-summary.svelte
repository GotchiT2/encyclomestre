<script lang="ts">
	import type { ApiSchemas } from '$lib/api/schema';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { Badge } from '$lib/components/ui/badge';
	let { guild }: { guild: ApiSchemas['GuildSummaryDTO'] } = $props();
</script>

<a
	href={resolve('/guilds/[id]', { id: String(guild.id) })}
	class="forge-panel flex min-w-0 items-center gap-4 p-5"
>
	{#if guild.image}<img src={guild.image} alt="" class="size-16 shrink-0 object-cover" />{/if}
	<div class="flex min-w-0 flex-col gap-2">
		<h2 class="break-words font-heading text-xl">{guild.name}</h2>
		<p class="text-sm">
			{$_('completion.guild.capacity', {
				values: { count: guild.nbMembers ?? 0, max: guild.maxMembers ?? 0 }
			})}
		</p>
		<Badge variant="outline">{$_('completion.guild.' + guild.joinPolicy)}</Badge>
	</div>
</a>
