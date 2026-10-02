<script lang="ts">
	import { _ } from '$lib/i18n';
	import { arcadePreferences, updateArcadePreferences } from '$lib/arcade/preferences';
	import { Button } from '$lib/components/ui/button';
</script>

<section class="forge-panel grid gap-4 p-4">
	<h2 class="text-2xl">{$_('arcade.preferences')}</h2>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p>{$_('navigation.boosters')}</p>
		<div class="flex gap-1">
			{#each ['immersive', 'express'] as opening (opening)}<Button
					variant={$arcadePreferences.opening === opening ? 'default' : 'outline'}
					aria-pressed={$arcadePreferences.opening === opening}
					onclick={() => updateArcadePreferences({ opening: opening as 'immersive' | 'express' })}
					>{$_('arcade.' + opening)}</Button
				>{/each}
		</div>
	</div>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p>{$_('arcade.motion')}</p>
		<div class="flex gap-1">
			{#each ['system', 'reduce'] as motion (motion)}<Button
					variant={$arcadePreferences.motion === motion ? 'default' : 'outline'}
					aria-pressed={$arcadePreferences.motion === motion}
					onclick={() => updateArcadePreferences({ motion: motion as 'system' | 'reduce' })}
					>{$_(motion === 'system' ? 'arcade.systemMotion' : 'arcade.reducedMotion')}</Button
				>{/each}
		</div>
	</div>
</section>
