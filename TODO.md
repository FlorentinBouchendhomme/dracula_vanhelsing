# TODO

- [x] chore => tooling (eslint/prettier) + CI
- [ ] chore => repo hygiene (license optional, codeowners optional, issue templates optional)

- [x] feat => shared protocol + types (events WS)
- [x] feat => shared game model (cards metadata, constants, enums)

- [x] feat => server gamestate + rules engine
- [x] feat => server action validation + error codes
- [x] feat => server rooms + join + resync refresh
- [x] feat => server persistence (in-memory only) + state snapshots for reconnect

- [x] feat => client ws layer + store + lobby
- [x] feat => client error handling + notifications
- [x] feat => board UI (common + player areas)
- [x] feat => cards UI + rules
- [x] feat => action UX (select target, confirm, cancel, disabled states)

- [ ] test => rules scenarios
- [ ] test => protocol tests (basic encode/decode, invalid messages)

- [x] feat => game flow + action log
- [ ] feat => win screen + restart game

- [ ] feat => final design
- [ ] chore => local release (docker-compose option)
- [ ] chore => docs (rules.md, protocol.md, runbook)
