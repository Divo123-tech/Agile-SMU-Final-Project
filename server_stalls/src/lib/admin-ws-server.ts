import type { Server as HttpServer, IncomingMessage } from "http";
import type { Duplex } from "stream";
import { URL } from "url";
import { WebSocket, WebSocketServer } from "ws";
import { pool } from "../db";
import {
  registerAdminClient,
  unregisterAdminClient,
} from "./admin-realtime";
import { verifyAccessToken } from "./jwt";

const WS_PATH = "/ws/admin";

async function isAdminAccount(accountId: number): Promise<boolean> {
  const { rows } = await pool.query<{ is_admin: boolean }>(
    "SELECT is_admin FROM accounts WHERE id = $1 LIMIT 1",
    [accountId]
  );

  return rows.length > 0 && rows[0].is_admin === true;
}

function rejectUpgrade(socket: Duplex, statusLine: string): void {
  socket.write(`${statusLine}\r\n\r\n`);
  socket.destroy();
}

function parseToken(request: IncomingMessage): string | null {
  const url = new URL(request.url ?? "", "http://localhost");
  const token = url.searchParams.get("token")?.trim();
  return token || null;
}

export function attachAdminWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket) => {
    registerAdminClient(ws);
    ws.on("close", () => unregisterAdminClient(ws));
    ws.on("error", () => unregisterAdminClient(ws));
  });

  server.on("upgrade", (request, socket, head) => {
    void (async () => {
      const pathname = new URL(request.url ?? "", "http://localhost").pathname;

      if (pathname !== WS_PATH) {
        rejectUpgrade(socket, "HTTP/1.1 404 Not Found");
        return;
      }

      const token = parseToken(request);
      if (!token) {
        rejectUpgrade(socket, "HTTP/1.1 401 Unauthorized");
        return;
      }

      try {
        const payload = verifyAccessToken(token);
        const isAdmin = await isAdminAccount(payload.sub);
        if (!isAdmin) {
          rejectUpgrade(socket, "HTTP/1.1 403 Forbidden");
          return;
        }
      } catch {
        rejectUpgrade(socket, "HTTP/1.1 401 Unauthorized");
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    })();
  });
}
