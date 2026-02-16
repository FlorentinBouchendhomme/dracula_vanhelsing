import { makeServerEnvelope } from "@game/shared";
import type { ErrorCode, ErrorPayload, ServerToClient } from "@game/shared";

export function makeError(code: ErrorCode, message: string, refId?: string): ServerToClient {
  const payload: ErrorPayload = refId ? { code, message, refId } : { code, message };

  return makeServerEnvelope("ERROR", payload, crypto.randomUUID());
}
