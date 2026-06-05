import { WebSocket } from "ws";
import { getAdminStallById } from "../services/admin.service";
import type { AdminStallResponse } from "../types/stall";

export type PendingStallCreatedMessage = {
  type: "pending_stall_created";
  stall: AdminStallResponse;
};

const adminClients = new Set<WebSocket>();

export function registerAdminClient(ws: WebSocket): void {
  adminClients.add(ws);
}

export function unregisterAdminClient(ws: WebSocket): void {
  adminClients.delete(ws);
}

export function broadcastToAdmins(message: PendingStallCreatedMessage): void {
  const payload = JSON.stringify(message);

  for (const client of adminClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/** Notify connected admins after a new pending stall is submitted. */
export async function notifyPendingStallCreated(stallId: number): Promise<void> {
  try {
    const stall = await getAdminStallById(stallId);
    if (stall.status !== "pending") {
      return;
    }

    broadcastToAdmins({ type: "pending_stall_created", stall });
  } catch (err) {
    console.error(
      `notifyPendingStallCreated failed for stallId=${stallId}:`,
      err
    );
  }
}
