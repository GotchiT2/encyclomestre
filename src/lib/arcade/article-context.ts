import { get, writable } from 'svelte/store';
import { currentSession } from '$lib/auth/session';
import { getWikiForgePublicPage } from '$lib/api/pages';
import { getWishlists, getWishlistPage } from '$lib/api/wishlist';
import type { CardWishlistReference, FriendOwnerInfo, WishlistRegistrySummary } from '$lib/types';
export type ArticleContext = {
	owned?: number;
	global?: number;
	friends?: FriendOwnerInfo[];
	wishlists?: CardWishlistReference[];
	failed?: boolean;
};
export const articleContexts = writable<Record<string, ArticleContext>>({});
let account: string | null = null,
	generation = 0,
	running = 0;
const pending = new Set<string>();
const visible = new Map<HTMLElement, string>();
const queue: Array<{ id: string; generation: number }> = [];
let lists: Promise<WishlistRegistrySummary[]> | undefined;
currentSession.subscribe((session) => {
	const next = session?.user.id ?? null;
	if (next === account) return;
	account = next;
	generation++;
	queue.length = 0;
	pending.clear();
	lists = undefined;
	articleContexts.set({});
});
async function drain() {
	while (running < 3 && queue.length) {
		const job = queue.shift()!;
		if (job.generation !== generation) continue;
		running++;
		void getWikiForgePublicPage(job.id)
			.then(async (page) => {
				if (job.generation !== generation) return;
				articleContexts.update((cache) => ({
					...cache,
					[job.id]: {
						owned: page.ownedCount,
						global: typeof page.globalCount === 'number' ? page.globalCount : undefined,
						friends: page.friends?.map((friend) => ({
							friendId: String(friend.id),
							username: friend.name,
							avatarUrl: '',
							ownedCount: friend.nbCards
						}))
					}
				}));
				// Each worker performs its reads sequentially; enrichment never blocks the grid.
				if ((page.title?.trim().length ?? 0) < 3) return;
				const ownedLists = await (lists ??= getWishlists());
				const memberships: CardWishlistReference[] = [];
				for (const list of ownedLists) {
					if (job.generation !== generation) return;
					if (list.cardCount === 0) continue;
					let pageNumber = 1;
					while (true) {
						const result = await getWishlistPage(list.id, { query: page.title, page: pageNumber });
						if (job.generation !== generation) return;
						if (
							result.items.some(
								(entry) => String(entry.card.baseCardId ?? entry.card.catalogueId) === job.id
							)
						) {
							memberships.push({ id: list.id, title: list.title, defaultList: false });
							break;
						}
						if (pageNumber >= result.meta.totalPages) break;
						pageNumber++;
					}
				}
				if (job.generation === generation)
					articleContexts.update((cache) => ({
						...cache,
						[job.id]: { ...cache[job.id], wishlists: memberships }
					}));
			})
			.catch(() => {
				if (job.generation === generation)
					articleContexts.update((cache) => ({
						...cache,
						[job.id]: { ...cache[job.id], failed: true }
					}));
			})
			.finally(() => {
				running--;
				if (job.generation === generation) pending.delete(job.id);
				void drain();
			});
	}
}
export function requestArticleContext(id: string) {
	if (!account || pending.has(id) || get(articleContexts)[id]) return;
	pending.add(id);
	queue.push({ id, generation });
	void drain();
}
export function invalidateArticleContexts() {
	generation++;
	pending.clear();
	queue.length = 0;
	lists = undefined;
	articleContexts.set({});
	for (const [node, id] of visible) if (node.isConnected) requestArticleContext(id);
}
export function observeArticle(node: HTMLElement, id: string) {
	const observer = new IntersectionObserver(
		(entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				visible.set(node, id);
				requestArticleContext(id);
			} else visible.delete(node);
		},
		{ rootMargin: '80px' }
	);
	observer.observe(node);
	return {
		destroy: () => {
			visible.delete(node);
			observer.disconnect();
		}
	};
}
