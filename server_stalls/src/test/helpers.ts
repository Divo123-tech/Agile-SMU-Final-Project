import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";

export type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

export function createMockRes(): MockResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as MockResponse;
}

export function createMockReq(
  options: {
    body?: unknown;
    params?: Record<string, string>;
    files?: unknown;
  } = {}
): Request {
  return {
    body: options.body,
    params: options.params ?? {},
    files: options.files,
  } as unknown as Request;
}

export function createMockNext(): NextFunction {
  return vi.fn() as NextFunction;
}
