<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { _ } from '$lib/i18n';

	const members = [
		{ id: 'demo-user', name: 'collectionneur-demo', role: 'Membre' },
		{ id: 'friend-0', name: 'SoneS9', role: 'Administrateur' },
		{ id: 'friend-1', name: 'TaeyeonFan', role: 'Membre' }
	];
</script>

<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('guild.eyebrow')}
		title={$_('guild.title')}
		description={$_('guild.description')}
	/>
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
		<ForgePanel class="p-6"
			><p class="forge-label">{$_('guild.objective')}</p>
			<h2 class="mt-3 font-serif text-3xl font-bold">{$_('guild.objective_title')}</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				{$_('guild.objective_description')}
			</p>
			<div class="mt-6 h-3 border border-primary/30 bg-background p-0.5">
				<div
					class="h-full w-[64%] bg-gradient-to-r from-[var(--energy)] to-primary shadow-[0_0_18px_rgb(25_167_170_/_35%)]"
				></div>
			</div>
			<p class="forge-label mt-3">{$_('guild.progress')}</p>
			<Button href="/messages" variant="outline" class="mt-5">{$_('guild.open_channel')}</Button
			></ForgePanel
		>
		<ForgePanel as="div" class="p-4"
			><h2 class="font-serif text-xl font-bold">{$_('guild.members')}</h2>
			<ul class="mt-4 divide-y divide-primary/15">
				{#each members as member (member.id)}<li
						class="flex items-center justify-between gap-3 py-3"
					>
						<a href={resolve('/users/[id]', { id: member.id })} class="font-serif font-bold"
							>@{member.name}</a
						><span class="forge-label text-[9px]">{member.role}</span>
					</li>{/each}
			</ul></ForgePanel
		>
	</div>
</section>
