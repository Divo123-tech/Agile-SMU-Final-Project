export type SignUpInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AccountResponse = {
  id: number;
  email: string;
  allergies: string[];
  isAdmin: boolean;
};

export type LoginResponse = {
  token: string;
  account: AccountResponse;
};

export type AccountRow = {
  id: number;
  email: string;
  password_hash: string;
  allergies: string[] | null;
  is_admin: boolean;
};

export type AccessTokenPayload = {
  sub: number;
  email: string;
  isAdmin: boolean;
};

export type UpdateAccountInput = {
  currentPassword: string;
  email?: string;
  newPassword?: string;
  allergies?: string[];
};
