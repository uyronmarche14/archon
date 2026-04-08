export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  emailVerifiedAt: string | null;
};

export type AuthSessionResponse = {
  user: AuthUser;
  accessToken: string;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
  redirectPath?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupResponse = {
  message: string;
  email: string;
  emailVerificationRequired: boolean;
};

export type LoginResponse = AuthSessionResponse;

export type AuthMeResponse = {
  user: AuthUser;
};

export type AuthRefreshResponse = {
  accessToken: string;
};

export type LogoutResponse = {
  loggedOut: true;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
  resetAvailable: boolean;
  resetToken: string | null;
  resetUrl: string | null;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type ResetPasswordResponse = {
  message: string;
  email: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
  email: string;
};
