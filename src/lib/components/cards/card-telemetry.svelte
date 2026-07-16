<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';
	let { card }: { card: CardRecord } = $props();
</script>

<dl
	class="grid grid-cols-3 divide-x divide-y divide-primary/10 border border-primary/20 sm:grid-cols-5"
>
	<div class="p-2">
		<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
			{$_('codex.attack')}
		</dt>
		<dd class="font-mono text-base text-primary">{card.attack}</dd>
	</div>
	<div class="p-2">
		<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
			{$_('codex.defense')}
		</dt>
		<dd class="font-mono text-base text-primary">{card.defense}</dd>
	</div>
	<div class="p-2">
		<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
			{$_('codex.owned')}
		</dt>
		<dd class="font-mono text-base text-primary">{card.ownedCount}</dd>
	</div>
	<div class="p-2">
		<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
			{$_('codex.supply')}
		</dt>
		<dd class="font-mono text-base text-primary">{card.globalSupply}</dd>
	</div>
	<div class="p-2">
		<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
			{$_('codex.views')}
		</dt>
		<dd class="font-mono text-base text-primary">{card.viewCount}</dd>
	</div>
</dl>
