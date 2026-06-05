import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebSocket } from "ws";

vi.mock("../services/admin.service", () => ({
  getAdminStallById: vi.fn(),
}));

import { getAdminStallById } from "../services/admin.service";
import {
  broadcastToAdmins,
  notifyPendingStallCreated,
  registerAdminClient,
  unregisterAdminClient,
} from "./admin-realtime";

const mockGetAdminStallById = vi.mocked(getAdminStallById);

describe("admin-realtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("broadcasts pending_stall_created to registered clients", () => {
    const client = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket;

    registerAdminClient(client);

    broadcastToAdmins({
      type: "pending_stall_created",
      stall: {
        id: 9,
        name: "New Wok",
        owner: 2,
        ownerEmail: "owner@example.com",
        description: "",
        address: "",
        image: "",
        proofOfOwnership: "",
        status: "pending",
        adminNotes: null,
        updatedAt: null,
      },
    });

    expect(client.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"pending_stall_created"')
    );

    unregisterAdminClient(client);
  });

  it("notifyPendingStallCreated loads stall and broadcasts when pending", async () => {
    const stall = {
      id: 9,
      name: "New Wok",
      owner: 2,
      ownerEmail: null,
      description: "",
      address: "",
      image: "",
      proofOfOwnership: "",
      status: "pending" as const,
      adminNotes: null,
      updatedAt: null,
    };

    mockGetAdminStallById.mockResolvedValueOnce(stall);

    const client = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket;

    registerAdminClient(client);

    await notifyPendingStallCreated(9);

    expect(mockGetAdminStallById).toHaveBeenCalledWith(9);
    expect(client.send).toHaveBeenCalled();

    unregisterAdminClient(client);
  });

  it("skips broadcast when stall is not pending", async () => {
    mockGetAdminStallById.mockResolvedValueOnce({
      id: 9,
      name: "New Wok",
      owner: 2,
      ownerEmail: null,
      description: "",
      address: "",
      image: "",
      proofOfOwnership: "",
      status: "approved",
      adminNotes: null,
      updatedAt: null,
    });

    const client = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as unknown as WebSocket;

    registerAdminClient(client);

    await notifyPendingStallCreated(9);

    expect(client.send).not.toHaveBeenCalled();

    unregisterAdminClient(client);
  });
});
