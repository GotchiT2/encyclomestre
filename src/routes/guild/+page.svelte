<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';

	const members = [
		{ id: 'demo-user', name: 'collectionneur-demo', role: 'Membre' },
		{ id: 'friend-0', name: 'SoneS9', role: 'Gardien' },
		{ id: 'friend-1', name: 'TaeyeonFan', role: 'Membre' }
	];
</script>

<section class="flex flex-col gap-6 pb-12">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('guild.eyebrow')}</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">{$_('guild.title')}</h1>
		<p class="mt-3 max-w-2xl font-serif italic text-muted-foreground">{$_('guild.description')}</p>
	</header>
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
		<div class="border-4 border-double border-primary/30 bg-card p-5"><p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('guild.objective')}</p><h2 class="mt-2 font-serif text-2xl font-black uppercase">{$_('guild.objective_title')}</h2><p class="mt-3 font-serif italic text-muted-foreground">{$_('guild.objective_description')}</p><div class="mt-5 h-3 border border-primary/30 bg-background"><div class="h-full w-[64%] bg-primary"></div></div><p class="mt-2 font-mono text-[10px] uppercase tracking-widest text-primary">{$_('guild.progress')}</p><Button href="/messages" variant="outline" class="mt-5">{$_('guild.open_channel')}</Button></div>
		<aside class="border border-primary/30 bg-card p-4"><h2 class="font-serif text-xl font-black uppercase">{$_('guild.members')}</h2><ul class="mt-4 divide-y divide-primary/15">{#each members as member (member.id)}<li class="flex items-center justify-between gap-3 py-3"><a href={`/users/${member.id}`} class="font-serif font-bold uppercase">@{member.name}</a><span class="font-mono text-[9px] uppercase tracking-widest text-primary">{member.role}</span></li>{/each}</ul></aside>
	</div>
</section>
