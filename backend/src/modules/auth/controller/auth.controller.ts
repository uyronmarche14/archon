import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiEnvelopedResponse } from '../../../common/swagger/decorators/api-enveloped-response.decorator';
import { ApiStandardErrorResponses } from '../../../common/swagger/decorators/api-standard-error-responses.decorator';
import {
  SWAGGER_BEARER_AUTH_NAME,
  SWAGGER_REFRESH_COOKIE_AUTH_NAME,
} from '../../../common/swagger/swagger.constants';
import { AuthRateLimit } from '../decorators/auth-rate-limit.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { AuthOriginGuard } from '../guards/auth-origin.guard';
import { AuthRateLimitGuard } from '../guards/auth-rate-limit.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  mapChangePasswordResponse,
  mapCurrentUserResponse,
  mapForgotPasswordResponse,
  mapLoginResponse,
  mapLogoutResponse,
  mapResetPasswordResponse,
  mapResendVerificationResponse,
  mapRefreshResponse,
  mapSignupResponse,
  mapVerifyEmailConfirmResponse,
} from '../mapper/auth.mapper';
import { SignupDto } from '../dto/signup.dto';
import { VerifyEmailConfirmDto } from '../dto/verify-email-confirm.dto';
import { AuthService } from '../service/auth.service';
import type {
  AuthUserResponse,
  ChangePasswordResponse,
  CurrentUserResponse,
  ForgotPasswordResponse,
  LoginResponse,
  LogoutResponse,
  RefreshAccessTokenResponse,
  ResetPasswordResponse,
  ResendVerificationResponse,
  SignupResponse,
  VerifyEmailConfirmResponse,
} from '../types/auth-response.type';
import { getCookieValue } from '../utils/auth-request.util';
import {
  clearRefreshTokenCookie,
  getRefreshCookieName,
  setRefreshTokenCookie,
} from '../utils/refresh-cookie.util';
import {
  SwaggerAuthSessionResponseDto,
  SwaggerChangePasswordResponseDto,
  SwaggerCurrentUserResponseDto,
  SwaggerForgotPasswordResponseDto,
  SwaggerLogoutResponseDto,
  SwaggerRefreshAccessTokenResponseDto,
  SwaggerResetPasswordResponseDto,
  SwaggerResendVerificationResponseDto,
  SwaggerSignupResponseDto,
  SwaggerVerifyEmailConfirmResponseDto,
} from '../swagger/auth-response.models';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'signup',
    limit: 5,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary:
      'Create a new account and continue with the configured onboarding flow.',
  })
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Account created successfully.',
    type: SwaggerSignupResponseDto,
  })
  @ApiStandardErrorResponses([400, 409, 429])
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignupResponse> {
    const signupResult = await this.authService.signup(signupDto);

    clearRefreshTokenCookie(response, this.configService);

    return mapSignupResponse(signupResult);
  }

  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'login',
    limit: 5,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary: 'Log in with email and password.',
  })
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Authentication succeeded.',
    type: SwaggerAuthSessionResponseDto,
  })
  @ApiStandardErrorResponses([400, 401, 403, 429])
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const loginResult = await this.authService.login(loginDto);

    setRefreshTokenCookie(
      response,
      this.configService,
      loginResult.refreshToken,
      loginResult.refreshTokenExpiresAt,
    );

    return mapLoginResponse(loginResult);
  }

  @Post('refresh')
  @UseGuards(AuthOriginGuard, AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'refresh',
    limit: 20,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary: 'Rotate the refresh cookie and issue a new access token.',
  })
  @ApiCookieAuth(SWAGGER_REFRESH_COOKIE_AUTH_NAME)
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Access token refreshed successfully.',
    type: SwaggerRefreshAccessTokenResponseDto,
  })
  @ApiStandardErrorResponses([401, 403, 429])
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshAccessTokenResponse> {
    const refreshResult = await this.authService.refresh(
      getCookieValue(
        request.headers.cookie,
        getRefreshCookieName(this.configService),
      ),
    );

    setRefreshTokenCookie(
      response,
      this.configService,
      refreshResult.refreshToken,
      refreshResult.refreshTokenExpiresAt,
    );

    return mapRefreshResponse(refreshResult.accessToken);
  }

  @Post('password/forgot')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'password-forgot',
    limit: 5,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary: 'Start the password reset flow for an email address.',
  })
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Password reset request accepted.',
    type: SwaggerForgotPasswordResponseDto,
  })
  @ApiStandardErrorResponses([400, 403, 429])
  forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    return this.authService
      .forgotPassword(forgotPasswordDto)
      .then(mapForgotPasswordResponse);
  }

  @Post('password/reset')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'password-reset',
    limit: 5,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary: 'Reset a password using a one-time token.',
  })
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Password reset completed successfully.',
    type: SwaggerResetPasswordResponseDto,
  })
  @ApiStandardErrorResponses([400, 404, 429])
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    return this.authService
      .resetPassword(resetPasswordDto)
      .then(mapResetPasswordResponse);
  }

  @Post('logout')
  @UseGuards(AuthOriginGuard)
  @ApiOperation({
    summary: 'Revoke the current refresh token and clear the session cookie.',
  })
  @ApiCookieAuth(SWAGGER_REFRESH_COOKIE_AUTH_NAME)
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Logged out successfully.',
    type: SwaggerLogoutResponseDto,
  })
  @ApiStandardErrorResponses([403])
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    const refreshToken = getCookieValue(
      request.headers.cookie,
      getRefreshCookieName(this.configService),
    );

    await this.authService.logout(refreshToken);
    clearRefreshTokenCookie(response, this.configService);

    return mapLogoutResponse();
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard, AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'password-change',
    limit: 5,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary: 'Change the password for the authenticated account.',
  })
  @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Password changed successfully.',
    type: SwaggerChangePasswordResponseDto,
  })
  @ApiStandardErrorResponses([400, 401, 403, 429])
  changePassword(
    @CurrentUser() currentUser: AuthUserResponse,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    return this.authService
      .changePassword(currentUser.id, changePasswordDto)
      .then(mapChangePasswordResponse);
  }

  @Post('verify-email/confirm')
  @UseGuards(AuthRateLimitGuard)
  @ApiExcludeEndpoint()
  @AuthRateLimit({
    key: 'verify-email-confirm',
    limit: 10,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary: 'Confirm an email verification token.',
  })
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Email verified successfully.',
    type: SwaggerVerifyEmailConfirmResponseDto,
  })
  @ApiStandardErrorResponses([400, 404, 429])
  confirmEmailVerification(
    @Body() verifyEmailConfirmDto: VerifyEmailConfirmDto,
  ): Promise<VerifyEmailConfirmResponse> {
    return this.authService
      .confirmEmailVerification(verifyEmailConfirmDto)
      .then(mapVerifyEmailConfirmResponse);
  }

  @Post('verify-email/resend')
  @UseGuards(AuthRateLimitGuard)
  @ApiExcludeEndpoint()
  @AuthRateLimit({
    key: 'verify-email-resend',
    limit: 5,
    windowMs: 60_000,
  })
  @ApiOperation({
    summary: 'Resend the email verification link when needed.',
  })
  @ApiEnvelopedResponse({
    status: 201,
    description: 'Verification email resend request accepted.',
    type: SwaggerResendVerificationResponseDto,
  })
  @ApiStandardErrorResponses([400, 429])
  resendEmailVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<ResendVerificationResponse> {
    return this.authService
      .resendEmailVerification(resendVerificationDto)
      .then(mapResendVerificationResponse);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Return the currently authenticated user profile.',
  })
  @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
  @ApiEnvelopedResponse({
    description: 'Current user loaded successfully.',
    type: SwaggerCurrentUserResponseDto,
  })
  @ApiStandardErrorResponses([401])
  getCurrentUser(
    @CurrentUser() currentUser: AuthUserResponse,
  ): CurrentUserResponse {
    return mapCurrentUserResponse(currentUser);
  }
}
