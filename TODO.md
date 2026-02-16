# TODO

- [x] chore => tooling (eslint/prettier) + CI
- [ ] chore => repo hygiene (license optional, codeowners optional, issue templates optional)

- [x] feat => shared protocol + types (events WS)
- [x] feat => shared game model (cards metadata, constants, enums)

- [ ] feat => server gamestate + rules engine
- [ ] feat => server action validation + error codes
- [ ] feat => server rooms + join + resync refresh
- [ ] feat => server persistence (in-memory only) + state snapshots for reconnect

- [ ] feat => client ws layer + store + lobby
- [ ] feat => client error handling + notifications
- [ ] feat => board UI (common + player areas)
- [ ] feat => cards UI + rules
- [ ] feat => action UX (select target, confirm, cancel, disabled states)

- [ ] test => rules scenarios
- [ ] test => protocol tests (basic encode/decode, invalid messages)

- [ ] feat => game flow + action log
- [ ] feat => win screen + restart game

- [ ] feat => final design
- [ ] chore => local release (docker-compose option)
- [ ] chore => docs (rules.md, protocol.md, runbook)
