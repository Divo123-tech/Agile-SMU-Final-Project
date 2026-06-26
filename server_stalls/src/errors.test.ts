import { describe, expect, it } from "vitest";
import {
  ForbiddenError,
  NotFoundError,
  ServiceError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("errors", () => {
  it("creates typed error instances", () => {
    expect(new NotFoundError("missing").name).toBe("NotFoundError");
    expect(new ServiceError("failed").name).toBe("ServiceError");
    expect(new ValidationError("invalid").name).toBe("ValidationError");
    expect(new ForbiddenError("denied").name).toBe("ForbiddenError");
    expect(new UnauthorizedError("auth").name).toBe("UnauthorizedError");
  });
});
