import { describe, expect, it } from 'vitest';
import {
	createSession,
	getVariant,
	isLandscapeCard,
	openPreviewPack,
	packs,
	poolKey,
	previewCard,
	restoreSession,
	stockFor,
	subjects,
	unavailableReason,
	variants
} from './catalogue';

const now = Date.parse('2026-09-18T12:00:00Z');
const [daily, chrome, nebula] = packs;

describe('local booster preview', () => {
	it('guarantees four standards and one numbered thematic card, consuming exactly one serial', () => {
		const before = createSession('normal', now);
		const result = openPreviewPack(nebula, before, now, () => 0);
		expect(result.cards).toHaveLength(5);
		expect(result.cards.slice(0, 4).map((card) => card.variantId)).toEqual([1, 1, 1, 1]);
		const special = result.cards[4];
		expect(special.serial).toBeDefined();
		expect(result.cards.slice(0, 4).every((card) => card.edition === daily.edition)).toBe(true);
		expect(special.edition).toBe(nebula.edition);
		expect(stockFor(nebula, result.session)).toBe(stockFor(nebula, before) - 1);
		expect(before.pools[poolKey(nebula.id, special.subjectId, special.variantId)]).toContain(
			special.serial!.number
		);
		expect(
			result.session.pools[poolKey(nebula.id, special.subjectId, special.variantId)]
		).not.toContain(special.serial!.number);
	});
	it('exhausts every serial without duplicates and rejects the next opening', () => {
		let session = createSession('normal', now);
		const initialStock = stockFor(nebula, session);
		const seen = new Set<string>();
		for (let i = 0; i < initialStock; i += 1) {
			const result = openPreviewPack(nebula, session, now, () => 0.52);
			session = result.session;
			const card = result.cards[4];
			seen.add(`${card.subjectId}:${card.variantId}:${card.serial!.number}`);
		}
		expect(seen.size).toBe(initialStock);
		expect(stockFor(nebula, session)).toBe(0);
		expect(unavailableReason(nebula, session, now)).toBe('exhausted');
		expect(() => openPreviewPack(nebula, session, now)).toThrow('exhausted');
	});
	it('enforces the daily cooldown and the 10 percent replacement boundary', () => {
		const session = createSession('normal', now);
		const lucky = openPreviewPack(daily, session, now, () => 0.099);
		expect(lucky.cards[4].variantId).toBe(2);
		expect(lucky.cards.every((card) => !card.serial)).toBe(true);
		expect(openPreviewPack(daily, session, now, () => 0.1).cards[4].variantId).toBe(1);
		expect(() => openPreviewPack(daily, lucky.session, now)).toThrow('daily_wait');
		expect(unavailableReason(daily, lucky.session, now + 86_400_000)).toBeNull();
	});
	it('uses Chrome subjects and a 20 percent numbered replacement while stocks last', () => {
		const session = createSession('normal', now);
		const lucky = openPreviewPack(chrome, session, now, () => 0.199);
		expect(lucky.cards.slice(0, 4).every((card) => card.variantId === 3)).toBe(true);
		expect(lucky.cards[4].serial).toBeDefined();
		expect(getVariant(lucky.cards[4].variantId).styles).toContain('CHROME');
		expect(
			openPreviewPack(chrome, session, now, () => 0.2).cards.every((card) => card.variantId === 3)
		).toBe(true);
		for (const key of Object.keys(session.pools))
			if (key.startsWith('chrome:')) session.pools[key] = [];
		expect(
			openPreviewPack(chrome, session, now, () => 0).cards.every((card) => card.variantId === 3)
		).toBe(true);
	});
	it('keeps the Chrome edition within its exact annual boundaries', () => {
		const session = createSession('normal', now);
		expect(unavailableReason(chrome, session, Date.parse(chrome.startsAt!) - 1)).toBe(
			'not_started'
		);
		expect(unavailableReason(chrome, session, Date.parse(chrome.startsAt!))).toBeNull();
		expect(unavailableReason(chrome, session, Date.parse(chrome.endsAt!))).toBe('expired');
		expect(() => openPreviewPack(chrome, createSession('chrome-expired', now), now)).toThrow(
			'expired'
		);
	});
	it('provides a deterministic last exemplar and preserves its state through reload', () => {
		const result = openPreviewPack(nebula, createSession('last', now), now, () => 0.5);
		expect(result.cards[4]).toMatchObject({
			subjectId: 'star-wars',
			variantId: 10,
			serial: { number: 7, total: 10 }
		});
		const restored = restoreSession(JSON.stringify(result.session));
		expect(restored).toEqual(result.session);
		expect(unavailableReason(nebula, restored, now)).toBe('exhausted');
	});
	it('rejects corrupt persisted serials and schema versions', () => {
		const invalid = createSession();
		invalid.pools[poolKey('nebula', 'blackpink', 9)] = [1, 1];
		expect(restoreSession(JSON.stringify(invalid))).toEqual(createSession());
		expect(restoreSession('{broken')).toEqual(createSession());
		expect(restoreSession(JSON.stringify({ ...createSession(), version: 2 }))).toEqual(
			createSession()
		);
	});
	it('separates visual renderers and individual numbering, with all five subjects in each series', () => {
		expect(getVariant(2).styles).toEqual(getVariant(5).styles);
		expect(getVariant(2).renderKey).not.toBe(getVariant(5).renderKey);
		expect(
			variants
				.filter((variant) => chrome.variantIds.includes(variant.id))
				.map((variant) => variant.printRun)
				.filter(Boolean)
		).toEqual([99, 50, 10, 1]);
		const state = createSession();
		for (const pack of packs)
			for (const id of pack.variantIds)
				if (getVariant(id).printRun) {
					for (const subject of subjects)
						expect(state.pools[poolKey(pack.id, subject.id, id)]).toBeDefined();
				}
	});
	it('uses a horizontal frame only for landscape full art photography', () => {
		expect(isLandscapeCard(previewCard(daily, 2, 'blackpink'))).toBe(true);
		expect(isLandscapeCard(previewCard(daily, 1, 'blackpink'))).toBe(false);
		expect(isLandscapeCard(previewCard(daily, 2, 'star-wars'))).toBe(true);
		expect(isLandscapeCard(previewCard(daily, 1, 'star-wars'))).toBe(false);
	});
});
