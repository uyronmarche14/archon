"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicAuthCard } from "@/features/auth/components/public-auth-card";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import { validateStrongPassword } from "@/features/auth/lib/password-validation";
import { showApiErrorToast, showSuccessToast } from "@/lib/toast";
import { isApiClientError } from "@/services/http/api-client-error";

type ResetPasswordFormErrors = {
  password?: string;
  confirmPassword?: string;
};

export function ResetPasswordPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPasswordMutation = useResetPassword();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const email = useMemo(
    () => searchParams.get("email")?.trim().toLowerCase() ?? "",
    [searchParams],
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const passwordError = validateStrongPassword(password);
    const confirmPasswordError =
      !confirmPassword
        ? "Please confirm your new password."
        : password !== confirmPassword
          ? "Passwords do not match."
          : undefined;

    setFieldErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });
    setFormError(null);

    if (passwordError || confirmPasswordError || !token) {
      if (!token) {
        setFormError("This password reset link is incomplete or invalid.");
      }

      return;
    }

    try {
      const response = await resetPasswordMutation.mutateAsync({
        token,
        password,
      });

      showSuccessToast("Password updated", response.message);
      router.replace(
        `/login?email=${encodeURIComponent(email || response.email)}` as Route,
      );
    } catch (error) {
      const message = isApiClientError(error)
        ? error.message
        : "Unable to reset your password right now.";

      setFormError(message);
      showApiErrorToast(error, "Unable to reset your password right now.");
    }
  }

  if (!token) {
    return (
      <PublicAuthCard
        eyebrow="Recovery"
        title="Reset link unavailable"
        description="The password reset link is missing its one-time token, so Archon cannot complete the reset."
        footerHref="/forgot-password"
        footerLabel="Need a new link?"
        footerText="Generate one"
      >
        <div className="space-y-3">
          <div className="rounded-[8px] border border-border/80 bg-muted/35 px-4 py-4 text-sm leading-6 text-muted-foreground">
            Request a new internal reset link from the forgot-password page, then return here with the full URL.
          </div>
          <Button asChild className="h-11 w-full rounded-[8px]">
            <Link href="/forgot-password">Go to forgot password</Link>
          </Button>
        </div>
      </PublicAuthCard>
    );
  }

  return (
    <PublicAuthCard
      eyebrow="Recovery"
      title="Choose a new password"
      description="Set a new password for your account, then return to login with the updated credentials."
      footerHref="/login"
      footerLabel="Want to stop here?"
      footerText="Back to login"
    >
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div className="rounded-[8px] bg-muted/45 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Password policy
            </p>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            Use at least 8 characters and include uppercase, lowercase, and a number.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">New password</span>
          <Input
            placeholder="NewStrongPassword123"
            type="password"
            autoComplete="new-password"
            className="h-11 rounded-[8px] border-border/80 bg-background px-4 shadow-none"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((currentErrors) => ({ ...currentErrors, password: undefined }));
              setFormError(null);
            }}
          />
          {fieldErrors.password ? (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          ) : null}
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Confirm new password</span>
          <Input
            placeholder="Repeat your new password"
            type="password"
            autoComplete="new-password"
            className="h-11 rounded-[8px] border-border/80 bg-background px-4 shadow-none"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                confirmPassword: undefined,
              }));
              setFormError(null);
            }}
          />
          {fieldErrors.confirmPassword ? (
            <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
          ) : null}
        </label>

        {formError ? (
          <div className="rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <Button
          size="lg"
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className="mt-1.5 h-11 w-full rounded-[8px] text-sm font-semibold shadow-[0_12px_24px_rgba(53,64,209,0.22)]"
        >
          {resetPasswordMutation.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Resetting password
            </>
          ) : (
            <>
              Save new password
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </PublicAuthCard>
  );
}
