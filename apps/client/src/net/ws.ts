import type { ClientToServer, ServerToClient } from "@game/shared";
import { isServerToClientMessage } from "@game/shared";

export type WsHandlers = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
  onMessage?: (msg: ServerToClient) => void;
};

export class WsClient {
  private ws: WebSocket | null = null;

  constructor(
    private url: string,
    private handlers: WsHandlers
  ) {}

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => this.handlers.onOpen?.();
    ws.onclose = () => this.handlers.onClose?.();
    ws.onerror = () => this.handlers.onError?.();

    ws.onmessage = (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (!isServerToClientMessage(parsed)) return;

      this.handlers.onMessage?.(parsed as ServerToClient);
    };
  }

  disconnect(): void {
    if (!this.ws) return;
    try {
      this.ws.close();
    } catch {
      // ignore
    }
    this.ws = null;
  }

  send(msg: ClientToServer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
