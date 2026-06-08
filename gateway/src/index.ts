import http from "http";
import type { RequestHandler } from "express";
import type { Socket } from "net";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const PORT = Number(process.env.PORT ?? 5000);
const ACCOUNTS_URL = process.env.ACCOUNTS_URL ?? "http://localhost:4001";
const DISHES_URL = process.env.DISHES_URL ?? "http://localhost:3000";
const STALLS_URL = process.env.STALLS_URL ?? "http://localhost:4002";

const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim());

/**
 * Express strips the mount path from req.url before the proxy runs.
 * Restore the full path so upstream receives e.g. /stalls not /.
 */
function mountProxy(target: string): RequestHandler {
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
  }) as RequestHandler;

  return (req, res, next) => {
    if (req.originalUrl) {
      req.url = req.originalUrl;
    }
    proxy(req, res, next);
  };
}

const accountsProxy = mountProxy(ACCOUNTS_URL);
const dishesProxy = mountProxy(DISHES_URL);
const stallsProxy = mountProxy(STALLS_URL);

const stallsWsProxy = createProxyMiddleware({
  target: STALLS_URL,
  changeOrigin: true,
  ws: true,
});

const app = express();

app.use(
  cors({
    origin: corsOrigins?.length ? corsOrigins : true,
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "gateway",
    routes: {
      accounts: ACCOUNTS_URL,
      dishes: DISHES_URL,
      stalls: STALLS_URL,
    },
  });
});

// server_accounts
app.use("/login", accountsProxy);
app.use("/sign-up", accountsProxy);
app.use("/account", accountsProxy);
app.use("/my-dishes", accountsProxy);

// server_dishes
app.use("/dishes", dishesProxy);

// server_stalls
app.use("/stalls", stallsProxy);
app.use("/my-stalls", stallsProxy);
app.use("/admin", stallsProxy);
app.use("/stall", stallsProxy);
app.use("/ws/admin", stallsWsProxy);

app.use((_req, res) => {
  res.status(404).json({ error: "No route matched on API gateway" });
});

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  const pathname = (req.url ?? "").split("?")[0];
  if (pathname === "/ws/admin" || pathname.startsWith("/ws/admin/")) {
    stallsWsProxy.upgrade(req, socket as Socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`API gateway listening on http://localhost:${PORT}`);
  console.log(`  accounts -> ${ACCOUNTS_URL}`);
  console.log(`  dishes   -> ${DISHES_URL}`);
  console.log(`  stalls   -> ${STALLS_URL}`);
  console.log(`  ws       -> ${STALLS_URL}/ws/admin`);
});
