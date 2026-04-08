import { AppRole } from '@prisma/client';

export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  emailVerifiedAt: string | null;
};

export type AuthSessionResponse = {
  user: AuthUserResponse;
  accessToken: string;
};

export type SignupResponse = {
  message: string;
  email: string;
  emailVerificationRequired: boolean;
};

export type LoginResponse = AuthSessionResponse;

export type RefreshAccessTokenResponse = {
  accessToken: string;
};

export type ForgotPasswordResponse = {
  message: string;
  resetAvailable: boolean;
  resetToken: string | null;
  resetUrl: string | null;
};

export type ResetPasswordResponse = {
  message: string;
  email: string;
};

export type ChangePasswordResponse = {
  message: string;
  email: string;
};

export type CurrentUserResponse = {
  user: AuthUserResponse;
};

export type LogoutResponse = {
  loggedOut: true;
};

export type VerifyEmailConfirmResponse = {
  verified: true;
  email: string;
  redirectPath: string | null;
};

export type ResendVerificationResponse = {
  message: string;
};

export type AuthSessionResult = AuthSessionResponse & {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type SignupResult = SignupResponse;

export type LoginResult = AuthSessionResult;

export type RefreshResult = RefreshAccessTokenResponse & {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type ForgotPasswordResult = ForgotPasswordResponse;

export type ResetPasswordResult = ResetPasswordResponse;

export type ChangePasswordResult = ChangePasswordResponse;

export type VerifyEmailConfirmResult = {
  verified: true;
  email: string;
  redirectPath: string | null;
};

export type ResendVerificationResult = ResendVerificationResponse;
