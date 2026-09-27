import { describe, it, expect, vi } from 'vitest';
import { createMockCatalogue, createTemplateLoader } from './catalogue';
import { presetDefinition, validateDefinition, landscapeFor, templateRef } from './definition';
describe('template catalogue', () => {
	it('publishes immutable revisions and rejects concurrent updates', async () => {
		const api = createMockCatalogue();
		const old = await api.read('cyberpunk', 1);
		const updated = presetDefinition('comics');
		const draft = await api.update('cyberpunk', 1, updated);
		await expect(api.publish('cyberpunk', 1)).rejects.toMatchObject({ status: 409 });
		const published = await api.publish('cyberpunk', draft.version);
		expect(published.revision).toBe(2);
		expect((await api.read('cyberpunk', 1)).definition).toEqual(old.definition);
		expect(published.definition.design.theme).toBe('comics');
	});
	it('coalesces concurrent reads and evicts failed requests', async () => {
		const api = createMockCatalogue(),
			read = vi.fn(api.read),
			loader = createTemplateLoader(read);
		const [a, b] = await Promise.all([loader.load('tpl:space@1'), loader.load('tpl:space@1')]);
		expect(a).toEqual(b);
		expect(read).toHaveBeenCalledTimes(1);
		await loader.load('tpl:space@1');
		expect(read).toHaveBeenCalledTimes(1);
		await expect(loader.load('tpl:absent@1')).rejects.toThrow();
		await expect(loader.load('tpl:absent@1')).rejects.toThrow();
		expect(read).toHaveBeenCalledTimes(3);
	});
	it('rejects incompatible definitions and strips sample data', () => {
		const d = presetDefinition('kawaii');
		expect(() => validateDefinition({ ...d, minEngineVersion: 3 })).toThrow();
		expect(() => validateDefinition({ ...d, design: { ...d.design, intensity: 999 } })).toThrow();
		expect(() => validateDefinition({ ...d, visual: { ...d.visual, color: 'url(x)' } })).toThrow();
		expect(validateDefinition({ ...d, title: 'Secret', serial: 17 })).not.toHaveProperty('title');
		expect(templateRef('tpl:space@1')).toEqual({ id: 'space', revision: 1 });
		expect(templateRef('tpl:../x@1')).toBeNull();
	});
	it('uses image ratio only for automatic full art and supports explicit landscape', () => {
		expect(landscapeFor('auto', true, 1200, 1000)).toBe(true);
		expect(landscapeFor('auto', false, 1200, 1000)).toBe(false);
		expect(landscapeFor('auto', true, 0, 0)).toBe(false);
		expect(landscapeFor('portrait', true, 1200, 1000)).toBe(false);
		expect(landscapeFor('landscape', false, 0, 0)).toBe(true);
	});
});
