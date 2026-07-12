# Encyclomestre implementation rules

For every UI addition or refactor, use `.agents/skills/encyclomestre-ui/SKILL.md`.

- Keep routes focused on orchestration; extract intermediate domain components for filters, editors, repeated grids, and fixed action panels.
- Do not add raw interface strings: use `svelte-i18n` keys.
- Preserve L'Alchimie Sombre and the shared card composition.
- Extend mocks for new visible states and validate each cohesive change before committing.
- Before each commit, update `.agents/PLAN.md`: mark the delivered step and record the Conventional Commit subject in that same commit.
