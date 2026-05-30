import axios from "axios"

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`${name} is not set. Add it to your .env file.`)
  }
  return value.replace(/\/$/, "")
}

/** server_dishes API base URL (no trailing slash). */
export const API_BASE_URL = requireEnv("VITE_DISHES_URL")

/** server_accounts API base URL (no trailing slash). */
export const ACCOUNTS_API_BASE_URL = requireEnv("VITE_ACCOUNTS_URL")

/** server_stalls API base URL (no trailing slash). */
export const STALLS_API_BASE_URL = requireEnv("VITE_STALLS_URL")

const TOKEN_STORAGE_KEY = "token"

export type LoginResponse = {
  token: string
  account: {
    id: number
    email: string
  }
}

export type Stall = {
  id: number
  name: string
  owner: number
  description: string
  address: string
  image: string
  proofOfOwnership: string
}

export type CreateStallResponse = Stall

export type MyStallsResponse = {
  userId: number
  count: number
  stalls: Stall[]
}

export type StallMenuDish = {
  id: string
  name: string
  description: string
  allergens: string[]
}

export type StallMenuCategory = {
  category: string
  dishes: StallMenuDish[]
}

export type StallMenuInfo = {
  name: string
  description: string
  image: string
  address: string
  owner: number
}

export type StallMenuResponse = {
  stall: StallMenuInfo | null
  categories: StallMenuCategory[]
}

export type CreateStallPayload = {
  name: string
  owner: number
  description: string
  address: string
  photo: File
  proofOfOwnership: File
}

export type UpdateStallPayload = {
  name: string
  description: string
  address: string
  photo?: File
  proofOfOwnership?: File
}

/** POST /stalls — multipart upload to server_stalls (S3-backed). */
export async function createStall(
  payload: CreateStallPayload,
): Promise<CreateStallResponse> {
  const formData = new FormData()
  formData.append("name", payload.name)
  formData.append("owner", payload.owner.toString())
  formData.append("description", payload.description)
  formData.append("address", payload.address)
  formData.append("photo", payload.photo)
  formData.append("proofOfOwnership", payload.proofOfOwnership)

  const { data } = await axios.post<CreateStallResponse>(
    `${STALLS_API_BASE_URL}/stalls`,
    formData,
  )

  return data
}

/** GET /my-stalls/:userId — stalls owned by the account. */
export async function getMyStalls(userId: number): Promise<MyStallsResponse> {
  const { data } = await axios.get<MyStallsResponse>(
    `${STALLS_API_BASE_URL}/my-stalls/${userId}`,
  )

  return data
}

/** GET /stall/:id — public stall menu (dishes grouped by category). */
export async function getStallMenu(stallId: number): Promise<StallMenuResponse> {
  const { data } = await axios.get<StallMenuResponse>(
    `${STALLS_API_BASE_URL}/stall/${stallId}`,
  )

  return data
}

/** GET /stalls/:id — single stall for edit (owner fields). */
export async function getStall(stallId: number): Promise<Stall> {
  const { data } = await axios.get<Stall>(
    `${STALLS_API_BASE_URL}/stalls/${stallId}`,
  )

  return data
}

/** PUT /stalls/:id — update stall details; files are optional. */
export async function updateStall(
  stallId: number,
  payload: UpdateStallPayload,
): Promise<Stall> {
  const formData = new FormData()
  formData.append("name", payload.name)
  formData.append("description", payload.description)
  formData.append("address", payload.address)
  if (payload.photo) formData.append("photo", payload.photo)
  if (payload.proofOfOwnership) {
    formData.append("proofOfOwnership", payload.proofOfOwnership)
  }

  const { data } = await axios.put<Stall>(
    `${STALLS_API_BASE_URL}/stalls/${stallId}`,
    formData,
  )

  return data
}

/** DELETE /stalls/:id — remove a stall and its dishes. */
export async function deleteStall(stallId: number): Promise<Stall> {
  const { data } = await axios.delete<Stall>(
    `${STALLS_API_BASE_URL}/stalls/${stallId}`,
  )

  return data
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

/** Attach stored JWT to outgoing axios requests. */
export function withAuthHeader(
  headers: Record<string, string> = {},
): Record<string, string> {
  const token = getAuthToken()
  if (!token) return headers
  return { ...headers, Authorization: `Bearer ${token}` }
}
