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

export type UserType = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  isOrganizationAdmin: boolean | null;
  createdAt: Date;
  organizationId: number | null;
  lastLogin: Date | null;
  organizationName?: string; // Added for UI display purposes
};