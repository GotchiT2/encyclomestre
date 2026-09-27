import {
  presetDefinition,
  themes,
  validateDefinition,
  templateRef,
  type TemplateDefinition,
} from "./definition";
export interface PublishedTemplate {
  id: string;
  revision: number;
  name: string;
  definition: TemplateDefinition;
}
export interface DraftTemplate {
  id: string;
  name: string;
  version: number;
  definition: TemplateDefinition;
  latestRevision: number;
}
export const catalogueId = (value: string) =>
  /^[a-z0-9][a-z0-9-]{0,39}$/.test(value);
export function validatePublished(
  value: unknown,
  id: string,
  revision: number,
): PublishedTemplate {
  const v = value as PublishedTemplate;
  if (
    !v ||
    v.id !== id ||
    v.revision !== revision ||
    typeof v.name !== "string" ||
    v.name.length > 64
  )
    throw new Error("INVALID_TEMPLATE");
  return { ...v, definition: validateDefinition(v.definition) };
}
export function createTemplateLoader(
  read: (id: string, revision: number) => Promise<unknown>,
) {
  const cache = new Map<string, Promise<PublishedTemplate>>();
  return {
    load(key: string) {
      const ref = templateRef(key);
      if (!ref) return Promise.reject(new Error("INVALID_TEMPLATE_KEY"));
      let value = cache.get(key);
      if (!value) {
        value = read(ref.id, ref.revision).then((v) =>
          validatePublished(v, ref.id, ref.revision),
        );
        cache.set(key, value);
        value.catch(() => cache.delete(key));
        if (cache.size > 100) cache.delete(cache.keys().next().value!);
      }
      return value;
    },
    clear() {
      cache.clear();
    },
  };
}
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export function createMockCatalogue() {
  const drafts = new Map<string, DraftTemplate>(),
    published = new Map<string, PublishedTemplate>();
  for (const theme of themes.filter((t) => t !== "classic")) {
    const definition = presetDefinition(theme);
    drafts.set(theme, {
      id: theme,
      name: theme,
      definition,
      version: 1,
      latestRevision: 1,
    });
    published.set(`${theme}@1`, {
      id: theme,
      name: theme,
      definition: copy(definition),
      revision: 1,
    });
  }
  function fail(code: string, status: number): never {
    throw Object.assign(new Error(code), { status });
  }
  function checked(id: string, version: number) {
    const d = drafts.get(id);
    if (!d) fail("NOT_FOUND", 404);
    if (d.version !== version) fail("TEMPLATE_CONFLICT", 409);
    return d;
  }
  return {
    async list() {
      return copy([...drafts.values()]);
    },
    async publicList() {
      return copy([...published.values()]);
    },
    async read(id: string, revision: number) {
      const value = published.get(`${id}@${revision}`);
      if (!value) fail("NOT_FOUND", 404);
      return copy(value);
    },
    async create(id: string, name: string, definition: TemplateDefinition) {
      if (!catalogueId(id) || !name.trim() || name.length > 64)
        fail("INVALID_TEMPLATE", 400);
      if (drafts.has(id)) fail("TEMPLATE_CONFLICT", 409);
      const d = {
        id,
        name,
        definition: validateDefinition(definition),
        version: 1,
        latestRevision: 0,
      };
      drafts.set(id, copy(d));
      return copy(d);
    },
    async update(
      id: string,
      expectedVersion: number,
      definition: TemplateDefinition,
    ) {
      const d = checked(id, expectedVersion);
      const next = {
        ...d,
        definition: validateDefinition(definition),
        version: d.version + 1,
      };
      drafts.set(id, copy(next));
      return copy(next);
    },
    async publish(id: string, expectedVersion: number) {
      const d = checked(id, expectedVersion),
        revision = d.latestRevision + 1;
      const next = {
        id,
        name: d.name,
        definition: copy(d.definition),
        revision,
      };
      published.set(`${id}@${revision}`, next);
      drafts.set(id, {
        ...d,
        version: d.version + 1,
        latestRevision: revision,
      });
      return copy(next);
    },
  };
}

export function validateDraft(input: unknown): DraftTemplate {
  const d = input as DraftTemplate;
  if (
    !d ||
    !catalogueId(d.id) ||
    typeof d.name !== "string" ||
    !d.name.trim() ||
    d.name.length > 64 ||
    !Number.isSafeInteger(d.version) ||
    d.version < 1 ||
    !Number.isSafeInteger(d.latestRevision) ||
    d.latestRevision < 0
  )
    throw new Error("INVALID_TEMPLATE");
  return {
    id: d.id,
    name: d.name,
    version: d.version,
    latestRevision: d.latestRevision,
    definition: validateDefinition(d.definition),
  };
}
