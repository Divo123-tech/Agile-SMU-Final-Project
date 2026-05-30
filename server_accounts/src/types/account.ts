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
};

export type LoginResponse = {
  token: string;
  account: AccountResponse;
};

export type AccountRow = {
  id: number;
  email: string;
  password_hash: string;
};

export type AccessTokenPayload = {
  sub: number;
  email: string;
};
