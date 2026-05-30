import dotenv from "dotenv";
import app from "./app";
import { testConnection } from "./db";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);

async function start(): Promise<void> {
  try {
    await testConnection();
    console.log("Connected to PostgreSQL");
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`server_accounts listening on http://localhost:${PORT}`);
  });
}

void start();
