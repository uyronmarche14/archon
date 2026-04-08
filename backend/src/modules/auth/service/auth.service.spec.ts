/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { RefreshToken, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';
import { MailService } from '../../mail/service/mail.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

describe('AuthService', () => {
  const resetTokenForSpec = 'reset-token-for-spec';
  const nextPasswordForSpec = 'PasswordForSpec1';
  let optionalConfigValues: Record<
    string,
    boolean | number | string | undefined
  >;

  const mockUser: User = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    role: 'MEMBER',
    emailVerifiedAt: new Date('2026-04-01T00:00:00.000Z'),
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
  };

  const unverifiedUser: User = {
    ...mockUser,
    emailVerifiedAt: null,
  };

  const activeRefreshToken: RefreshToken = {
    id: 'refresh-token-1',
    userId: 'user-1',
    tokenHash: 'hashed-existing-refresh-token',
    expiresAt: new Date('2026-04-08T00:00:00.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string | boolean> = {
        JWT_ACCESS_SECRET: 'test-access-secret-12345',
        JWT_REFRESH_SECRET: 'test-refresh-secret-12345',
        JWT_ACCESS_TTL: '15m',
        JWT_REFRESH_TTL: '7d',
        REFRESH_COOKIE_NAME: 'archon_refresh_token',
        REFRESH_COOKIE_SECURE: false,
        FRONTEND_URL: 'http://localhost:3000',
        NODE_ENV: 'test',
        APP_URL: 'http://localhost:4001',
        PORT: '4001',
      };

      return (
        (optionalConfigValues[key] as string | boolean | undefined) ??
        config[key]
      );
    }),
    get: jest.fn(
      (key: string) =>
        optionalConfigValues[key] ??
        (
          {
            REFRESH_COOKIE_SECURE: false,
          } as Record<string, boolean | number | string | undefined>
        )[key],
    ),
  } as unknown as ConfigService;

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const mockMailService = {
    sendMail: jest.fn(),
  } as unknown as jest.Mocked<MailService>;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService & {
    user: {
      create: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    emailVerificationToken: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    passwordResetToken: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const bcryptHash = bcrypt.hash as unknown as jest.Mock;
  const bcryptCompare = bcrypt.compare as unknown as jest.Mock;
  const jwtSignAsync = mockJwtService.signAsync as jest.Mock;
  const jwtVerifyAsync = mockJwtService.verifyAsync as jest.Mock;
  const sendMail = mockMailService.sendMail as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    optionalConfigValues = {};

    bcryptHash.mockReset();
    bcryptCompare.mockReset();
    jwtSignAsync.mockReset();
    jwtVerifyAsync.mockReset();
    sendMail.mockReset();

    mockPrismaService.user.create.mockReset();
    mockPrismaService.user.delete.mockReset();
    mockPrismaService.user.findUnique.mockReset();
    mockPrismaService.user.update.mockReset();
    mockPrismaService.refreshToken.create.mockReset();
    mockPrismaService.refreshToken.findMany.mockReset();
    mockPrismaService.refreshToken.update.mockReset();
    mockPrismaService.refreshToken.updateMany.mockReset();
    mockPrismaService.emailVerificationToken.create.mockReset();
    mockPrismaService.emailVerificationToken.deleteMany.mockReset();
    mockPrismaService.emailVerificationToken.findUnique.mockReset();
    mockPrismaService.emailVerificationToken.update.mockReset();
    mockPrismaService.passwordResetToken.create.mockReset();
    mockPrismaService.passwordResetToken.deleteMany.mockReset();
    mockPrismaService.passwordResetToken.findUnique.mockReset();
    mockPrismaService.passwordResetToken.update.mockReset();
    mockPrismaService.passwordResetToken.updateMany.mockReset();
    mockPrismaService.$transaction.mockReset();

    bcryptHash.mockResolvedValue('hashed-value');
    bcryptCompare.mockResolvedValue(true);
    mockPrismaService.user.create.mockResolvedValue(unverifiedUser);
    mockPrismaService.user.delete.mockResolvedValue(undefined);
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
      emailVerifiedAt: new Date('2026-04-02T00:00:00.000Z'),
    });
    mockPrismaService.refreshToken.create.mockResolvedValue(undefined);
    mockPrismaService.refreshToken.findMany.mockResolvedValue([
      activeRefreshToken,
    ]);
    mockPrismaService.refreshToken.update.mockResolvedValue(undefined);
    mockPrismaService.refreshToken.updateMany.mockResolvedValue({
      count: 1,
    });
    mockPrismaService.emailVerificationToken.create.mockResolvedValue({
      id: 'verification-token-1',
    });
    mockPrismaService.emailVerificationToken.deleteMany.mockResolvedValue({
      count: 0,
    });
    mockPrismaService.emailVerificationToken.update.mockResolvedValue({
      id: 'verification-token-1',
    });
    mockPrismaService.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'verification-token-1',
      userId: 'user-1',
      tokenHash: 'hashed-token',
      redirectPath: '/app/projects/project-1',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      consumedAt: null,
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      user: mockUser,
    });
    mockPrismaService.passwordResetToken.create.mockResolvedValue({
      id: 'password-reset-token-1',
    });
    mockPrismaService.passwordResetToken.deleteMany.mockResolvedValue({
      count: 0,
    });
    mockPrismaService.passwordResetToken.update.mockResolvedValue({
      id: 'password-reset-token-1',
    });
    mockPrismaService.passwordResetToken.updateMany.mockResolvedValue({
      count: 0,
    });
    mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
      id: 'password-reset-token-1',
      userId: 'user-1',
      tokenHash: 'hashed-reset-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      consumedAt: null,
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      user: mockUser,
    });
    sendMail.mockResolvedValue(undefined);
    jwtVerifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'jane@example.com',
      role: 'MEMBER',
    });
    mockPrismaService.$transaction.mockImplementation(
      (
        input:
          | Promise<unknown>[]
          | ((client: typeof mockPrismaService) => Promise<unknown>),
      ) =>
        Array.isArray(input) ? Promise.all(input) : input(mockPrismaService),
    );
  });

  it('creates an unverified member and sends a verification email during signup', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'required';
    const authService = createAuthService();

    const result = await authService.signup({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'StrongPass1',
      redirectPath: '/app/projects/project-1',
    });

    expect(mockPrismaService.user.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hashed-value',
        role: 'MEMBER',
        emailVerifiedAt: null,
      },
    });
    expect(
      mockPrismaService.emailVerificationToken.deleteMany,
    ).toHaveBeenCalled();
    expect(
      mockPrismaService.emailVerificationToken.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String),
        redirectPath: '/app/projects/project-1',
        expiresAt: expect.any(Date),
      }),
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: 'Verify your Archon account',
      }),
    );
    const sendMailCalls = sendMail.mock.calls as Array<
      [
        {
          text: string;
          html: string;
        },
      ]
    >;
    const verificationEmail = sendMailCalls[0][0];

    expect(verificationEmail.text).toContain(
      'http://localhost:3000/verify-email?token=',
    );
    expect(verificationEmail.text).toContain('email=jane%40example.com');
    expect(verificationEmail.text).toContain(
      'next=%2Fapp%2Fprojects%2Fproject-1',
    );
    expect(verificationEmail.html).toContain('Verify my account');
    expect(verificationEmail.html).toContain(
      'http://localhost:3000/verify-email?token=',
    );
    expect(verificationEmail.html).toContain('email=jane%40example.com');
    expect(verificationEmail.html).toContain(
      'next=%2Fapp%2Fprojects%2Fproject-1',
    );
    expect(result).toEqual({
      message: 'Check your email to verify your account',
      email: 'jane@example.com',
      emailVerificationRequired: true,
    });
  });

  it('creates a verified member immediately when verification bypass is enabled', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'bypass';
    mockPrismaService.user.create.mockResolvedValue({
      ...mockUser,
      emailVerifiedAt: new Date('2026-04-06T00:00:00.000Z'),
    });
    const authService = createAuthService();

    const result = await authService.signup({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'StrongPass1',
      redirectPath: '/app/projects/project-1',
    });

    expect(mockPrismaService.user.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hashed-value',
        role: 'MEMBER',
        emailVerifiedAt: expect.any(Date),
      },
    });
    expect(
      mockPrismaService.emailVerificationToken.deleteMany,
    ).not.toHaveBeenCalled();
    expect(
      mockPrismaService.emailVerificationToken.create,
    ).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Account created successfully. You can log in now.',
      email: 'jane@example.com',
      emailVerificationRequired: false,
    });
  });

  it('maps duplicate email errors to conflict exceptions', async () => {
    mockPrismaService.user.create.mockRejectedValue({ code: 'P2002' });
    const authService = createAuthService();

    await expect(
      authService.signup({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rolls back the new user when verification mail setup fails during signup', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'required';
    sendMail.mockRejectedValue(new Error('SMTP is not configured'));
    const authService = createAuthService();

    await expect(
      authService.signup({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'StrongPass1',
      }),
    ).rejects.toThrow('SMTP is not configured');

    expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
    });
  });

  it('logs in a verified user and persists a fresh refresh token', async () => {
    jwtSignAsync
      .mockResolvedValueOnce('login-access-token')
      .mockResolvedValueOnce('login-refresh-token');
    bcryptHash.mockResolvedValueOnce('hashed-login-refresh-token');
    const authService = createAuthService();

    const result = await authService.login({
      email: 'jane@example.com',
      password: 'StrongPass1',
    });

    expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: 'hashed-login-refresh-token',
        expiresAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      user: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'MEMBER',
        emailVerifiedAt: '2026-04-01T00:00:00.000Z',
      },
      accessToken: 'login-access-token',
      refreshToken: 'login-refresh-token',
      refreshTokenExpiresAt: expect.any(Date),
    });
  });

  it('rejects login when email verification is still pending', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'required';
    mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
    const authService = createAuthService();

    await expect(
      authService.login({
        email: 'jane@example.com',
        password: 'StrongPass1',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'FORBIDDEN',
        message: 'Email verification is required before login',
        details: {
          needsVerification: true,
          email: 'jane@example.com',
        },
      },
    });
  });

  it('allows login for an unverified user when verification bypass is enabled', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'bypass';
    mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
    jwtSignAsync
      .mockResolvedValueOnce('login-access-token')
      .mockResolvedValueOnce('login-refresh-token');
    bcryptHash.mockResolvedValueOnce('hashed-login-refresh-token');
    const authService = createAuthService();

    const result = await authService.login({
      email: 'jane@example.com',
      password: 'StrongPass1',
    });

    expect(result.accessToken).toBe('login-access-token');
    expect(result.refreshToken).toBe('login-refresh-token');
  });

  it('rejects invalid email or password during login with a generic 401', async () => {
    bcryptCompare.mockResolvedValueOnce(false);
    const authService = createAuthService();

    await expect(
      authService.login({
        email: 'jane@example.com',
        password: 'WrongPassword1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates the refresh token and returns a new access token', async () => {
    jwtSignAsync
      .mockResolvedValueOnce('rotated-access-token')
      .mockResolvedValueOnce('rotated-refresh-token');
    bcryptHash.mockResolvedValueOnce('hashed-rotated-refresh-token');
    const authService = createAuthService();

    const result = await authService.refresh('existing-refresh-token');

    expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
      where: {
        id: 'refresh-token-1',
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: 'hashed-rotated-refresh-token',
        expiresAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
      refreshTokenExpiresAt: expect.any(Date),
    });
  });

  it('generates an internal password reset link for an existing user in non-production', async () => {
    const authService = createAuthService();

    const result = await authService.forgotPassword({
      email: 'jane@example.com',
    });

    expect(mockPrismaService.passwordResetToken.deleteMany).toHaveBeenCalled();
    expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
    expect(result).toEqual({
      message:
        'Password reset link generated for internal testing. Use it to continue the reset flow.',
      resetAvailable: true,
      resetToken: expect.any(String),
      resetUrl: expect.stringContaining(
        'http://localhost:3000/reset-password?token=',
      ),
    });
    expect(result.resetUrl).toContain('email=jane%40example.com');
  });

  it('rejects forgot password in production when internal demo reset links are disabled', async () => {
    const authService = createAuthService();
    optionalConfigValues.NODE_ENV = 'production';

    await expect(
      authService.forgotPassword({
        email: 'jane@example.com',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'FORBIDDEN',
        message: 'Password reset demo links are disabled on this deployment.',
      },
    });

    expect(mockPrismaService.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('allows forgot password in production when internal demo reset links are explicitly enabled', async () => {
    const authService = createAuthService();
    optionalConfigValues.NODE_ENV = 'production';
    optionalConfigValues.ALLOW_INTERNAL_PASSWORD_RESET_IN_PRODUCTION = true;

    const result = await authService.forgotPassword({
      email: 'jane@example.com',
    });

    expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
    expect(result).toEqual({
      message:
        'Password reset link generated for internal testing. Use it to continue the reset flow.',
      resetAvailable: true,
      resetToken: expect.any(String),
      resetUrl: expect.stringContaining(
        'http://localhost:3000/reset-password?token=',
      ),
    });
  });

  it('resets the password, consumes reset tokens, and revokes refresh tokens', async () => {
    const authService = createAuthService();

    const result = await authService.resetPassword({
      token: resetTokenForSpec,
      password: nextPasswordForSpec,
    });

    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        passwordHash: 'hashed-value',
      },
    });
    expect(mockPrismaService.passwordResetToken.update).toHaveBeenCalledWith({
      where: {
        id: 'password-reset-token-1',
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
    expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      message:
        'Password reset successfully. Please log in with your new password.',
      email: 'jane@example.com',
    });
  });

  it('changes the password when the current password is correct', async () => {
    const authService = createAuthService();

    const result = await authService.changePassword('user-1', {
      currentPassword: 'StrongPass1',
      newPassword: nextPasswordForSpec,
    });

    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        passwordHash: 'hashed-value',
      },
    });
    expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      message: 'Password changed successfully. Please log in again.',
      email: 'jane@example.com',
    });
  });

  it('rejects change password when the current password is incorrect', async () => {
    bcryptCompare.mockResolvedValueOnce(false);
    const authService = createAuthService();

    await expect(
      authService.changePassword('user-1', {
        currentPassword: 'WrongPassword1',
        newPassword: nextPasswordForSpec,
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'FORBIDDEN',
        message: 'Current password is incorrect',
        details: {
          currentPassword: ['Current password is incorrect.'],
        },
      },
    });
  });

  it('rotates refresh tokens for unverified users when verification bypass is enabled', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'bypass';
    mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
    jwtSignAsync
      .mockResolvedValueOnce('rotated-access-token')
      .mockResolvedValueOnce('rotated-refresh-token');
    bcryptHash.mockResolvedValueOnce('hashed-rotated-refresh-token');
    const authService = createAuthService();

    const result = await authService.refresh('existing-refresh-token');

    expect(result.accessToken).toBe('rotated-access-token');
    expect(result.refreshToken).toBe('rotated-refresh-token');
  });

  it('confirms email verification and consumes the verification token', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'required';
    const authService = createAuthService();

    const result = await authService.confirmEmailVerification({
      token: 'verification-token',
    });

    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
      data: {
        emailVerifiedAt: expect.any(Date),
      },
    });
    expect(
      mockPrismaService.emailVerificationToken.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'verification-token-1',
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      verified: true,
      email: 'jane@example.com',
      redirectPath: '/app/projects/project-1',
    });
  });

  it('returns a dormant verification success when bypass mode is active', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'bypass';
    const authService = createAuthService();

    const result = await authService.confirmEmailVerification({
      token: 'test-confirmation-placeholder',
    });

    expect(
      mockPrismaService.emailVerificationToken.findUnique,
    ).not.toHaveBeenCalled();
    expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    expect(
      mockPrismaService.emailVerificationToken.update,
    ).not.toHaveBeenCalled();
    expect(result).toEqual({
      verified: true,
      email: '',
      redirectPath: null,
    });
  });

  it('resends verification mail only for existing unverified accounts', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'required';
    mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
    const authService = createAuthService();

    const result = await authService.resendEmailVerification({
      email: 'jane@example.com',
      redirectPath: '/app',
    });

    expect(
      mockPrismaService.emailVerificationToken.deleteMany,
    ).toHaveBeenCalled();
    expect(mockPrismaService.emailVerificationToken.create).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'If the account needs verification, a new email is on the way.',
    });
  });

  it('treats resend verification as a no-op when verification bypass is enabled', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'bypass';
    mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
    const authService = createAuthService();

    const result = await authService.resendEmailVerification({
      email: 'jane@example.com',
      redirectPath: '/app',
    });

    expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    expect(
      mockPrismaService.emailVerificationToken.create,
    ).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'If the account needs verification, a new email is on the way.',
    });
  });

  it('returns the current user for a valid access token', async () => {
    const authService = createAuthService();

    const result = await authService.getCurrentUser('access-token');

    expect(result).toEqual({
      user: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'MEMBER',
        emailVerifiedAt: '2026-04-01T00:00:00.000Z',
      },
    });
  });

  it('returns the current user even if unverified when verification bypass is enabled', async () => {
    optionalConfigValues.EMAIL_VERIFICATION_MODE = 'bypass';
    mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
    const authService = createAuthService();

    const result = await authService.getCurrentUser('access-token');

    expect(result.user.emailVerifiedAt).toBeNull();
  });

  function createAuthService() {
    return new AuthService(
      mockPrismaService,
      mockJwtService,
      mockConfigService,
      mockMailService,
    );
  }
});
