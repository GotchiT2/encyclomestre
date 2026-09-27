import type { Auction } from '$lib/types';

/** Owns network work independently of Svelte's reactive reads. One instance per route/session. */
export function createAuctionDetailController(options: {
	id: string;
	authenticated: boolean;
	read: (signal: AbortSignal) => Promise<Auction>;
	watch: () => Promise<unknown>;
	unwatch: () => Promise<unknown>;
	onValue: (auction: Auction) => void;
	onLoading: (loading: boolean) => void;
	onError: (error: unknown) => void;
	onWatchError: (error: unknown) => void;
}) {
	let disposed = false;
	let value: Auction | undefined;
	let readPending: Promise<void> | undefined;
	let queuedRead = false;
	let revision = 0;
	let lastWatchAt: number | undefined;
	let watched = false;
	let watching = false;
	let watchFailed = false;
	let watchTimer: ReturnType<typeof setTimeout> | undefined;
	let eventTimer: ReturnType<typeof setTimeout> | undefined;
	const abort = new AbortController();

	function scheduleWatch() {
		clearTimeout(watchTimer);
		if (disposed || !options.authenticated || !value || value.status !== 'OPEN' || watching) return;
		const now = Date.now();
		const starts = Date.parse(value.startsAt);
		const ends = Date.parse(value.endsAt);
		if (!Number.isFinite(starts) || !Number.isFinite(ends) || now >= ends) return;
		const next = Math.max(starts, lastWatchAt === undefined ? now : lastWatchAt + 60_000);
		if (next >= ends) return;
		watchTimer = setTimeout(() => void renewWatch(), Math.max(0, next - now));
	}

	async function renewWatch() {
		if (disposed || watching) return;
		if (!value || value.status !== 'OPEN' || Date.now() >= Date.parse(value.endsAt)) return;
		if (Date.now() < Date.parse(value.startsAt)) {
			scheduleWatch();
			return;
		}
		watching = true;
		watched = true;
		lastWatchAt = Date.now();
		try {
			await options.watch();
			watchFailed = false;
			if (!disposed) options.onWatchError(null);
		} catch (error) {
			if (!disposed && !watchFailed) options.onWatchError(error);
			watchFailed = true;
		} finally {
			watching = false;
			if (disposed) void options.unwatch().catch(() => undefined);
			else scheduleWatch();
		}
	}

	function accept(next: Auction) {
		if (disposed || next.id !== options.id) return;
		value = next;
		options.onValue(next);
		scheduleWatch();
	}

	function reload(): Promise<void> {
		if (disposed) return Promise.resolve();
		if (readPending) {
			queuedRead = true;
			return readPending;
		}
		const expectedRevision = revision;
		options.onLoading(true);
		readPending = options
			.read(abort.signal)
			.then((next) => {
				if (revision === expectedRevision) accept(next);
			})
			.catch((error: unknown) => {
				if (!disposed && revision === expectedRevision) options.onError(error);
			})
			.finally(() => {
				readPending = undefined;
				if (disposed) return;
				options.onLoading(false);
				if (queuedRead) {
					queuedRead = false;
					event();
				}
			});
		return readPending;
	}

	function event() {
		if (disposed) return;
		// First event schedules one read; bursts cannot postpone it indefinitely.
		if (eventTimer !== undefined) return;
		eventTimer = setTimeout(() => {
			eventTimer = undefined;
			void reload();
		}, 150);
	}

	return {
		reload,
		event,
		adopt(next: Auction) {
			revision++;
			accept(next);
		},
		dispose() {
			disposed = true;
			abort.abort();
			clearTimeout(watchTimer);
			clearTimeout(eventTimer);
			if (watched && !watching) void options.unwatch().catch(() => undefined);
		}
	};
}
