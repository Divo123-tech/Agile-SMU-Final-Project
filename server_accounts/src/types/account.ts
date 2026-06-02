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
};

export type AccessTokenPayload = {
  sub: number;
  email: string;
};

export type UpdateAccountInput = {
  currentPassword: string;
  email?: string;
  newPassword?: string;
  allergies?: string[];
};
