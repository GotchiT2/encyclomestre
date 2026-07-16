---
name: encyclomestre-ui
description: Build or refactor Encyclomestre SvelteKit interfaces with the L'Alchimie Sombre design language, reusable intermediate components, svelte-i18n strings, and local mock-compatible data. Use for routes, layouts, card views, collection interactions, forms, filters, dialogs, and Shadcn-Svelte styling in this repository.
---

# Encyclomestre UI

## Required workflow

1. Read `references/design-system.md` before changing visible UI.
2. Keep route files as composition and data orchestration only. Extract a component when a section has its own stateful interaction, repeated visual structure, or more than one meaningful concern.
3. Put reusable components under `src/lib/components/<domain>/`; use descriptive domain names. Keep component inputs typed and expose callbacks or bindable state deliberately.
4. Use `svelte-i18n` for every new interface string. Add French keys by domain in `src/lib/locales/fr.json`.
5. Reuse Shadcn-Svelte components first. Preserve square/double copper framing and semantic Tailwind tokens.
6. Update mocks when new visible data states need previewing. Do not depend on remote content for core UI states.
7. Verify with `npm run check`, targeted ESLint, relevant Vitest tests, and `git diff --check`. Commit each cohesive increment separately.

## Component boundaries

- Route: loading data, page-level state, composition.
- Filter/control component: inputs and filter interactions only.
- Editor/overlay component: its local draft state and explicit save/delete callbacks.
- Repeated card/list component: rendering and per-item interaction callbacks.
- Fixed action bar: selection state presentation and action triggers only.

Avoid a component that both fetches data, owns unrelated page state, renders a repeated list, and edits an entity.
