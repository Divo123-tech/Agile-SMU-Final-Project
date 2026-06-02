import type { NextFunction, Request, Response } from "express";
import { NotFoundError, ServiceError, ValidationError } from "../errors";
import { uploadStallFileToS3 } from "../lib/s3";
import { getStallMenu } from "../services/stall-menu.service";
import {
  createStall,
  deleteStall,
  getStalls,
  getMyStalls,
  getStallById,
  updateStall,
} from "../services/stall.service";
import type { CreateStallInput } from "../types/stall";

function parseStallIdParam(id: string | string[]): number {
  const raw = Array.isArray(id) ? id[0] : id;
  const stallId = Number(raw);

  if (!Number.isInteger(stallId) || stallId <= 0) {
    throw new ValidationError("stall id must be a positive integer");
  }

  return stallId;
}

function parseUserIdParam(id: string | string[]): number {
  const raw = Array.isArray(id) ? id[0] : id;
  const userId = Number(raw);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ValidationError("userId must be a positive integer");
  }

  return userId;
}

type StallFiles = {
  photo?: Express.Multer.File[];
  proofOfOwnership?: Express.Multer.File[];
};

function parseStallTextFields(body: unknown): Pick<
  CreateStallInput,
  "name" | "description" | "address" | "owner"
> {
  if (body == null || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }

  const { name, description, address, owner } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    throw new ValidationError("name is required");
  }

  if (typeof description !== "string" || description.trim() === "") {
    throw new ValidationError("description is required");
  }

  if (typeof address !== "string" || address.trim() === "") {
    throw new ValidationError("address is required");
  }

  const parsedOwner = Number(owner);
  if (!Number.isInteger(parsedOwner) || parsedOwner <= 0) {
    throw new ValidationError("owner must be a positive integer");
  }

  return {
    name: name.trim(),
    description: description.trim(),
    address: address.trim(),
    owner: parsedOwner,
  };
}

function parseUpdateStallTextFields(
  body: unknown
): Pick<CreateStallInput, "name" | "description" | "address"> {
  if (body == null || typeof body !== "object") {
    throw new ValidationError("Request body is required");
  }

  const { name, description, address } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    throw new ValidationError("name is required");
  }

  if (typeof description !== "string" || description.trim() === "") {
    throw new ValidationError("description is required");
  }

  if (typeof address !== "string" || address.trim() === "") {
    throw new ValidationError("address is required");
  }

  return {
    name: name.trim(),
    description: description.trim(),
    address: address.trim(),
  };
}

function requireFiles(files: StallFiles): {
  photo: Express.Multer.File;
  proof: Express.Multer.File;
} {
  const photo = files.photo?.[0];
  if (!photo) {
    throw new ValidationError("photo is required");
  }

  const proof = files.proofOfOwnership?.[0];
  if (!proof) {
    throw new ValidationError("proofOfOwnership is required");
  }

  return { photo, proof };
}

function optionalFiles(files: StallFiles): {
  photo?: Express.Multer.File;
  proof?: Express.Multer.File;
} {
  return {
    photo: files.photo?.[0],
    proof: files.proofOfOwnership?.[0],
  };
}

function handleStallError(
  err: unknown,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ServiceError) {
    res.status(503).json({ error: err.message });
    return;
  }

  if (err instanceof Error && err.message.includes("Unexpected field")) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof Error && err.message.includes("File too large")) {
    res.status(400).json({ error: "file size must not exceed 10MB" });
    return;
  }

  if (err instanceof Error && err.message.includes("must be")) {
    res.status(400).json({ error: err.message });
    return;
  }

  next(err);
}

export async function createStallHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const textFields = parseStallTextFields(req.body);
    const { photo, proof } = requireFiles((req.files ?? {}) as StallFiles);

    const [imageUrl, proofOfOwnershipUrl] = await Promise.all([
      uploadStallFileToS3(photo, "photos"),
      uploadStallFileToS3(proof, "proofs"),
    ]);

    const stall = await createStall({
      ...textFields,
      imageUrl,
      proofOfOwnershipUrl,
    });

    res.status(201).json(stall);
  } catch (err) {
    handleStallError(err, res, next);
  }
}

export async function getMyStallsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseUserIdParam(req.params.userId as string | string[]);
    const result = await getMyStalls(userId);
    res.json(result);
  } catch (err) {
    handleStallError(err, res, next);
  }
}

export async function getStallsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getStalls();
    res.json(result);
  } catch (err) {
    handleStallError(err, res, next);
  }
}

export async function getStallByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stallId = parseStallIdParam(req.params.id as string | string[]);
    const stall = await getStallById(stallId);
    res.json(stall);
  } catch (err) {
    handleStallError(err, res, next);
  }
}

/** Public menu: stall header + dishes grouped by category (migrated from server_dishes). */
export async function getStallMenuHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stallId = parseStallIdParam(req.params.id as string | string[]);
    const menu = await getStallMenu(stallId);
    res.json(menu);
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({
        error: err.message,
        stall: null,
        categories: [],
      });
      return;
    }

    handleStallError(err, res, next);
  }
}

export async function updateStallHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stallId = parseStallIdParam(req.params.id as string | string[]);
    const textFields = parseUpdateStallTextFields(req.body);
    const { photo, proof } = optionalFiles((req.files ?? {}) as StallFiles);

    const imageUrl = photo
      ? await uploadStallFileToS3(photo, "photos")
      : undefined;
    const proofOfOwnershipUrl = proof
      ? await uploadStallFileToS3(proof, "proofs")
      : undefined;

    const stall = await updateStall(stallId, {
      ...textFields,
      imageUrl,
      proofOfOwnershipUrl,
    });

    res.json(stall);
  } catch (err) {
    handleStallError(err, res, next);
  }
}

export async function deleteStallHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stallId = parseStallIdParam(req.params.id as string | string[]);
    const stall = await deleteStall(stallId);
    res.json(stall);
  } catch (err) {
    handleStallError(err, res, next);
  }
}
