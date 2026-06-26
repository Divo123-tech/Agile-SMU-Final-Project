import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotFoundError,
  ServiceError,
  UnauthorizedError,
  ValidationError,
} from "../errors";
import { accountResponse } from "../test/fixtures/account";
import { createMockNext, createMockReq, createMockRes } from "../test/helpers";
import {
  getAccountHandler,
  updateAccountHandler,
} from "./account.controller";
import * as accountService from "../services/account.service";

vi.mock("../services/account.service", () => ({
  getAccountById: vi.fn(),
  updateAccount: vi.fn(),
}));

const mockGetAccount = vi.mocked(accountService.getAccountById);
const mockUpdateAccount = vi.mocked(accountService.updateAccount);

describe("Account controller", () => {
  const res = createMockRes();
  let next: ReturnType<typeof createMockNext>;
  const authReq = { accountId: 1, body: {} } as {
    accountId: number;
    body: unknown;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    next = createMockNext();
  });

  it("getAccountHandler returns account", async () => {
    mockGetAccount.mockResolvedValue(accountResponse);

    await getAccountHandler(authReq as never, res, next);

    expect(res.json).toHaveBeenCalledWith(accountResponse);
  });

  it("getAccountHandler maps NotFoundError to 404", async () => {
    mockGetAccount.mockRejectedValue(new NotFoundError("missing"));

    await getAccountHandler(authReq as never, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("updateAccountHandler validates body", async () => {
    await updateAccountHandler(
      { ...authReq, body: { currentPassword: "" } } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUpdateAccount).not.toHaveBeenCalled();
  });

  it("updateAccountHandler maps duplicate email to 409", async () => {
    mockUpdateAccount.mockRejectedValue(
      new ValidationError("email is already registered")
    );

    await updateAccountHandler(
      {
        ...authReq,
        body: { currentPassword: "old", email: "new@example.com" },
      } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("updateAccountHandler rejects invalid allergen", async () => {
    await updateAccountHandler(
      {
        ...authReq,
        body: { currentPassword: "old", allergies: ["not-real"] },
      } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "invalid allergen: not-real" });
  });

  it("updateAccountHandler rejects non-lowercase email", async () => {
    await updateAccountHandler(
      {
        ...authReq,
        body: { currentPassword: "old", email: "User@Example.com" },
      } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "email must be lowercase" });
  });

  it("updateAccountHandler returns 401 for wrong password", async () => {
    mockUpdateAccount.mockRejectedValue(new UnauthorizedError("Invalid password"));

    await updateAccountHandler(
      {
        ...authReq,
        body: { currentPassword: "wrong" },
      } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("updateAccountHandler returns 503 on service error", async () => {
    mockUpdateAccount.mockRejectedValue(new ServiceError("down"));

    await updateAccountHandler(
      {
        ...authReq,
        body: { currentPassword: "old" },
      } as never,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("getAccountHandler forwards unknown errors", async () => {
    const err = new Error("unexpected");
    mockGetAccount.mockRejectedValue(err);

    await getAccountHandler(authReq as never, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
