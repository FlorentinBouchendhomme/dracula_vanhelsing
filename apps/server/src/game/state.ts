import { createInitialGameState } from "@game/shared";
import type { GameState } from "@game/shared";

export function makeNewGameState(): GameState {
  return createInitialGameState();
}
