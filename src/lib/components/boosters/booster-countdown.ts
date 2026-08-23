export function formatBoosterDelay(delay: number) {
	const safeDelay = Math.max(0, delay);
	const totalSeconds = Math.floor(safeDelay / 1_000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getBoosterRefreshDelay(nextAvailableAt: string | null, now = Date.now()) {
	if (!nextAvailableAt) return null;
	const timestamp = new Date(nextAvailableAt).getTime();
	if (!Number.isFinite(timestamp) || timestamp <= now) return null;
	return timestamp - now;
}
