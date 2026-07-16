<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import { _ } from '$lib/i18n';
	import type { WishlistEntry, WishlistPriority } from '$lib/types';

	let {
		open = $bindable(false),
		entry,
		onSave
	}: {
		open?: boolean;
		entry: WishlistEntry | null;
		onSave: (input: { priority: WishlistPriority; note: string | null }) => void;
	} = $props();

	let priority = $state<WishlistPriority>('medium');
	let note = $state('');

	$effect(() => {
		if (entry) {
			priority = entry.priority;
			note = entry.note ?? '';
		}
	});

	function save() {
		onSave({ priority, note: note.trim() || null });
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		class="border-4 border-double border-primary/40 bg-card p-0 sm:inset-x-[20%] sm:bottom-6 sm:max-w-none"
	>
		<div class="border-b border-primary/20 p-4 pr-14">
			<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('wishlist.registry')}
			</p>
			<Sheet.Title class="mt-1 font-serif text-2xl font-black uppercase tracking-tight"
				>{$_('wishlist.edit')}</Sheet.Title
			>
		</div>
		<div class="grid gap-4 p-4">
			<label class="grid gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('wishlist.priority')}
				<select
					bind:value={priority}
					class="h-10 border-2 border-primary/40 bg-background px-3 text-xs outline-none focus:border-primary"
				>
					<option value="high">{$_('wishlist.priority_high')}</option>
					<option value="medium">{$_('wishlist.priority_medium')}</option>
					<option value="low">{$_('wishlist.priority_low')}</option>
				</select>
			</label>
			<label class="grid gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('wishlist.note')}
				<Input bind:value={note} placeholder={$_('wishlist.note_placeholder')} />
			</label>
			<Button onclick={save}>{$_('common.save')}</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
