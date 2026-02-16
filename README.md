# Dracula vs Van Helsing (local)

Project => online board game (2 players) in local:

- Client => Vue 3 (Vite)
- Server => Node + WebSocket ("ws")
- Shared => types + protocol

## Getting Started

Prerequisites => Node 20+ ; PNPM

```bash
pnpm i
pnpm dev
```

- Client => http://localhost:5173
- WS Server => ws://localhost:8787

## Scripts

- `pnpm dev` => start client + server
- `pnpm build` => build everything
- `pnpm typecheck` => typecheck everything
