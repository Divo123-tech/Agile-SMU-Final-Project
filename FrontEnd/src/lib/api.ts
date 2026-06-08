import axios from "axios"

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "")
}

function envUrl(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name]
  return value ? stripTrailingSlash(value) : undefined
}

const gatewayUrl = envUrl("VITE_API_URL")

/** Dishes API — gateway or legacy VITE_DISHES_URL. */
export const API_BASE_URL =
  gatewayUrl ?? envUrl("VITE_DISHES_URL") ?? missingEnv("VITE_API_URL or VITE_DISHES_URL")

/** Accounts API — gateway or legacy VITE_ACCOUNTS_URL. */
export const ACCOUNTS_API_BASE_URL =
  gatewayUrl ?? envUrl("VITE_ACCOUNTS_URL") ?? missingEnv("VITE_API_URL or VITE_ACCOUNTS_URL")

/** Stalls API — gateway or legacy VITE_STALLS_URL. */
export const STALLS_API_BASE_URL =
  gatewayUrl ?? envUrl("VITE_STALLS_URL") ?? missingEnv("VITE_API_URL or VITE_STALLS_URL")

function missingEnv(names: string): never {
  throw new Error(`${names} is not set. Add to FrontEnd/.env (gateway: VITE_API_URL=http://localhost:5000).`)
}

const TOKEN_STORAGE_KEY = "token"

export type LoginResponse = {
  token: string
  account: {
    id: number
    email: string
    allergies: string[]
    isAdmin: boolean
  }
}

export type AccountProfile = LoginResponse["account"]

export type StallStatus = "pending" | "approved" | "rejected"

export type Stall = {
  id: number
  name: string
  owner: number
  description: string
  address: string
  image: string
  proofOfOwnership: string
  status: StallStatus
  adminNotes: string | null
}

export type AdminStall = Stall & {
  ownerEmail: string | null
}

export type PendingStallsResponse = {
  count: number
  stalls: AdminStall[]
}

export type CreateStallResponse = Stall

export type MyStallsResponse = {
  userId: number
  count: number
  stalls: Stall[]
}

export type StallsResponse = {
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
  updatedAt: string | null
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

/** GET /admin/stalls/pending — stalls awaiting approval (admin only). */
export async function getPendingStalls(): Promise<PendingStallsResponse> {
  const { data } = await axios.get<PendingStallsResponse>(
    `${STALLS_API_BASE_URL}/admin/stalls/pending`,
    { headers: withAuthHeader() },
  )
  return data
}

/** GET /admin/stalls/:id — full stall details for review (admin only). */
export async function getAdminStall(stallId: number): Promise<AdminStall> {
  const { data } = await axios.get<AdminStall>(
    `${STALLS_API_BASE_URL}/admin/stalls/${stallId}`,
    { headers: withAuthHeader() },
  )
  return data
}

/** GET /admin/stalls/:id/menu — dishes for a pending stall (admin only). */
export async function getAdminStallMenu(
  stallId: number,
): Promise<StallMenuResponse> {
  const { data } = await axios.get<StallMenuResponse>(
    `${STALLS_API_BASE_URL}/admin/stalls/${stallId}/menu`,
    { headers: withAuthHeader() },
  )
  return data
}

/** PATCH /admin/stalls/:id/status — approve or reject a pending stall. */
export async function reviewStall(
  stallId: number,
  status: "approved" | "rejected",
  adminNotes?: string,
): Promise<AdminStall> {
  const { data } = await axios.patch<AdminStall>(
    `${STALLS_API_BASE_URL}/admin/stalls/${stallId}/status`,
    { status, ...(adminNotes !== undefined ? { adminNotes } : {}) },
    { headers: withAuthHeader({ "Content-Type": "application/json" }) },
  )
  return data
}

/** GET /stalls — list all stalls for public browsing. */
export async function getStalls(): Promise<StallsResponse> {
  const { data } = await axios.get<StallsResponse>(`${STALLS_API_BASE_URL}/stalls`)
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

/** GET /account — profile for the signed-in user. */
export async function getAccount(): Promise<AccountProfile> {
  const { data } = await axios.get<AccountProfile>(
    `${ACCOUNTS_API_BASE_URL}/account`,
    { headers: withAuthHeader() },
  )

  return data
}

export type UpdateAccountPayload = {
  currentPassword: string
  email?: string
  newPassword?: string
  allergies?: string[]
}

/** PATCH /account — update email and/or password; returns a fresh JWT. */
export async function updateAccount(
  payload: UpdateAccountPayload,
): Promise<LoginResponse> {
  const { data } = await axios.patch<LoginResponse>(
    `${ACCOUNTS_API_BASE_URL}/account`,
    payload,
    { headers: withAuthHeader({ "Content-Type": "application/json" }) },
  )

  setAuthToken(data.token)
  return data
}

export type BookmarkedDish = {
  id: string
  stallId: number
  stallName: string
  name: string
  description: string
  allergens: string[]
  category: string
  savedAt: string
}

export type MyDishesResponse = {
  stalls: { id: number; name: string }[]
  dishes: BookmarkedDish[]
}

/** GET /my-dishes — saved dishes and stall filter options. */
export async function getMyDishes(): Promise<MyDishesResponse> {
  const { data } = await axios.get<MyDishesResponse>(
    `${ACCOUNTS_API_BASE_URL}/my-dishes`,
    { headers: withAuthHeader() },
  )

  return data
}

/** POST /my-dishes/:dishId — bookmark a dish. */
export async function bookmarkDish(dishId: number): Promise<BookmarkedDish> {
  const { data } = await axios.post<BookmarkedDish>(
    `${ACCOUNTS_API_BASE_URL}/my-dishes/${dishId}`,
    {},
    { headers: withAuthHeader() },
  )

  return data
}

/** DELETE /my-dishes/:dishId — remove a bookmark. */
export async function unbookmarkDish(dishId: number): Promise<void> {
  await axios.delete(`${ACCOUNTS_API_BASE_URL}/my-dishes/${dishId}`, {
    headers: withAuthHeader(),
  })
}

/** Attach stored JWT to outgoing axios requests. */
export function withAuthHeader(
  headers: Record<string, string> = {},
): Record<string, string> {
  const token = getAuthToken()
  if (!token) return headers
  return { ...headers, Authorization: `Bearer ${token}` }
}
