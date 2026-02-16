# Contributing

## Branching

- "main" => stable
- "dev" => integration
- branches => from "dev":
  - "feat/<scope>-<slug>"
  - "fix/<scope>-<slug>"
  - "chore/<scope>-<slug>"
  - "hotfix/<scope>-<slug>" (from main; then back-merge main -> dev)

## PR

- branches => PR to "dev"
- "dev" => PR to "main" for release
- checklist => build ok; typecheck ok; description "what/why"; steps to test

## Commits

Prefixes => "feat:"; "fix:"; "chore:"; "hotfix:"
Optional scope => "feat(server): ..."; "feat(client): ..."
