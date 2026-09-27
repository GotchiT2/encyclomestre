import { describe, it, expect } from 'vitest';
import { draftKey, writeDraft, readDraft, clearDrafts, draftLifetime } from './storage';
function storage(): Storage {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		key: (i) => [...values.keys()][i] ?? null,
		getItem: (k) => values.get(k) ?? null,
		setItem: (k, v) => {
			values.set(k, v);
		},
		removeItem: (k) => {
			values.delete(k);
		},
		clear: () => values.clear()
	};
}
describe('Opt-in draft persistence', () => {
	it('isolates accounts and targets and expires after 24 hours', () => {
		const s = storage();
		writeDraft(s, draftKey('1', 'trade:2'), 'draft', 100);
		expect(readDraft(s, draftKey('2', 'trade:2'), 101)).toBeNull();
		expect(readDraft(s, draftKey('1', 'trade:3'), 101)).toBeNull();
		expect(readDraft(s, draftKey('1', 'trade:2'), 101)).toBe('draft');
		expect(readDraft(s, draftKey('1', 'trade:2'), 100 + draftLifetime)).toBeNull();
	});
	it('clears drafts on logout without removing other preferences', () => {
		const s = storage();
		s.setItem('theme', 'dark');
		writeDraft(s, draftKey('1', 'message:2'), 'draft');
		clearDrafts(s);
		expect(s.length).toBe(1);
		expect(s.getItem('theme')).toBe('dark');
	});
	it('removes sent drafts and tolerates corrupt storage', () => {
		const s = storage();
		writeDraft(s, 'draft', 'hello');
		writeDraft(s, 'draft', '');
		expect(readDraft(s, 'draft')).toBeNull();
		s.setItem('draft', '{');
		expect(readDraft(s, 'draft')).toBeNull();
	});
});
