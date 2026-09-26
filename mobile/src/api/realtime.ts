// Minimal SignalR client for /hubs/chat over a plain WebSocket (JSON protocol).
// The hub only pushes events and takes one fire-and-forget call (Typing), so the
// full @microsoft/signalr client isn't needed.
import { API_URL } from "./client";

const RS = "\u001e"; // SignalR record separator
const PING_MS = 15_000; // the server drops clients silent for 30 s
const MAX_RETRY_MS = 30_000;

enum MessageType {
  Invocation = 1,
  Ping = 6,
  Close = 7,
}

type Handler = (payload: never) => void;

export type Realtime = {
  /** Calls a hub method without waiting for a result, e.g. send("Typing", conversationId) */
  send: (target: string, ...args: unknown[]) => void;
  close: () => void;
};

export function hubUrl(token: string): string {
  return `${API_URL.replace(/^http/, "ws")}/hubs/chat?access_token=${encodeURIComponent(token)}`;
}

/** Stays connected (reconnecting with backoff) until close() is called */
export function connectRealtime(token: string, handlers: Record<string, Handler>): Realtime {
  let socket: WebSocket | null = null;
  let ready = false;
  let closed = false;
  let attempt = 0;
  let ping: ReturnType<typeof setInterval> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const write = (message: object) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message) + RS);
  };

  const onFrame = (frame: string) => {
    const message = JSON.parse(frame) as { type?: number; target?: string; arguments?: unknown[]; error?: string };
    if (!ready) {
      // First frame is the handshake reply: {} or {"error": "..."}
      if (message.error) socket?.close();
      ready = !message.error;
      attempt = 0;
      return;
    }
    if (message.type === MessageType.Invocation && message.target) {
      const handler = handlers[message.target] as ((...args: unknown[]) => void) | undefined;
      handler?.(...(message.arguments ?? []));
    } else if (message.type === MessageType.Close) {
      socket?.close();
    }
  };

  const open = () => {
    ready = false;
    socket = new WebSocket(hubUrl(token));
    socket.onopen = () => {
      socket?.send(JSON.stringify({ protocol: "json", version: 1 }) + RS);
      ping = setInterval(() => write({ type: MessageType.Ping }), PING_MS);
    };
    socket.onmessage = (e) => {
      String(e.data)
        .split(RS)
        .filter(Boolean)
        .forEach(onFrame);
    };
    socket.onclose = () => {
      clearInterval(ping);
      socket = null;
      if (closed) return;
      // 1 s, 2 s, 4 s … up to 30 s
      retry = setTimeout(open, Math.min(MAX_RETRY_MS, 1000 * 2 ** attempt++));
    };
    // onclose follows every error
    socket.onerror = () => {};
  };

  open();

  return {
    send: (target, ...args) => {
      if (ready) write({ type: MessageType.Invocation, target, arguments: args });
    },
    close: () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(ping);
      socket?.close();
    },
  };
}
