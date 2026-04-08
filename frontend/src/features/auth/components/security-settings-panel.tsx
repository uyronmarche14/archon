"use client";

import type { Route } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import { useAuthSession } from "@/features/auth/providers/auth-session-provider";
import { validateStrongPassword } from "@/features/auth/lib/password-validation";
import { showApiErrorToast, showSuccessToast } from "@/lib/toast";
import { isApiClientError } from "@/services/http/api-client-error";

type SecuritySettingsErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export function SecuritySettingsPanel() {
  const router = useRouter();
  const changePasswordMutation = useChangePassword();
  const { clearSession, session } = useAuthSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SecuritySettingsErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentPasswordError = currentPassword
      ? undefined
      : "Current password is required.";
    const newPasswordError = validateStrongPassword(newPassword);
    const confirmPasswordError =
      !confirmPassword
        ? "Please confirm your new password."
        : newPassword !== confirmPassword
          ? "Passwords do not match."
          : undefined;

    setFieldErrors({
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
    });
    setFormError(null);

    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      return;
    }

    try {
      const response = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      showSuccessToast("Password changed", response.message);
      clearSession();
      router.replace(
        `/login?email=${encodeURIComponent(response.email || session?.user.email || "")}` as Route,
      );
    } catch (error) {
      const message = isApiClientError(error)
        ? error.message
        : "Unable to change your password right now.";

      if (isApiClientError(error)) {
        setFieldErrors((currentErrors) => ({
          ...currentErrors,
          currentPassword: readFieldError(error.details?.currentPassword),
          newPassword: readFieldError(error.details?.newPassword),
        }));
      }

      setFormError(message);
      showApiErrorToast(error, "Unable to change your password right now.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Security
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Change password
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Update your workspace password, then sign back in with the new credentials.
            Changing the password ends existing refresh-token sessions for this account.
          </p>
        </header>

        <Card className="border-border/75 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <CardTitle className="text-lg">Account credentials</CardTitle>
            </div>
            <CardDescription>
              Signed in as <strong>{session?.user.email ?? "your account"}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Current password</span>
                <Input
                  placeholder="Current password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 rounded-[8px] border-border/80 bg-background px-4 shadow-none"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      currentPassword: undefined,
                    }));
                    setFormError(null);
                  }}
                />
                {fieldErrors.currentPassword ? (
                  <p className="text-xs text-destructive">{fieldErrors.currentPassword}</p>
                ) : null}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">New password</span>
                <Input
                  placeholder="New strong password"
                  type="password"
                  autoComplete="new-password"
                  className="h-11 rounded-[8px] border-border/80 bg-background px-4 shadow-none"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      newPassword: undefined,
                    }));
                    setFormError(null);
                  }}
                />
                {fieldErrors.newPassword ? (
                  <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
                ) : null}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Confirm new password</span>
                <Input
                  placeholder="Repeat the new password"
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

              {formError ? (
                <div className="rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="h-11 rounded-[8px] px-5 text-sm font-semibold shadow-[0_12px_24px_rgba(53,64,209,0.22)]"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Updating password
                  </>
                ) : (
                  "Save new password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function readFieldError(value: string[] | string | boolean | number | null | undefined) {
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return undefined;
}
