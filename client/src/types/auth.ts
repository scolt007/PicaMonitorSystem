// Define types for authentication-related operations

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  password: string;
  name: string;
  email: string;
  role?: string;
  signupCode?: string;
  organizationName?: string;
};