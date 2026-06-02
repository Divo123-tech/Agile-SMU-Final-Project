import type { AccountResponse, AccountRow, LoginInput, LoginResponse, SignUpInput } from "../../types/account";

export const signUpBody: SignUpInput = {
  email: "user@example.com",
  password: "securePassword123",
};

export const loginBody: LoginInput = signUpBody;

export const accountRow: AccountRow = {
  id: 1,
  email: "user@example.com",
  password_hash: "$2b$10$hashedvalue",
  allergies: ["peanuts", "soy"],
};

export const accountResponse: AccountResponse = {
  id: 1,
  email: "user@example.com",
  allergies: ["soy"],
};

export const loginResponse: LoginResponse = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
  account: accountResponse,
};
