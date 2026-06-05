import http from "http";
import dotenv from "dotenv";
import app from "./app";
import { attachAdminWebSocket } from "./lib/admin-ws-server";
import { testConnection } from "./db";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);

function requireJwtConfig(): void {
  if (!process.env.JWT_SECRET?.trim()) {
    console.error(
      "JWT_SECRET is not set. Copy the same JWT_SECRET from server_accounts/.env into server_stalls/.env, then restart."
    );
    process.exit(1);
  }
}

async function start(): Promise<void> {
  requireJwtConfig();

  try {
    await testConnection();
    console.log("Connected to PostgreSQL");
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err);
    process.exit(1);
  }

  const server = http.createServer(app);
  attachAdminWebSocket(server);

  server.listen(PORT, () => {
    console.log(`server_stalls listening on http://localhost:${PORT}`);
    console.log(`Admin WebSocket: ws://localhost:${PORT}/ws/admin`);
  });
}

void start();
