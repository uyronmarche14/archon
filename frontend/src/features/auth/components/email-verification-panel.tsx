"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, MailCheck, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirmEmailVerification } from "@/features/auth/hooks/use-confirm-email-verification";
import { useResendVerification } from "@/features/auth/hooks/use-resend-verification";
import { showApiErrorToast, showSuccessToast } from "@/lib/toast";

type EmailVerificationPanelProps = {
  email: string | null;
  token: string | null;
  nextPath: string;
};

export function EmailVerificationPanel({
  email,
  token,
  nextPath,
}: EmailVerificationPanelProps) {
  const router = useRouter();
  const confirmMutation = useConfirmEmailVerification();
  const resendMutation = useResendVerification();
  const [hasAttemptedAutoConfirm, setHasAttemptedAutoConfirm] = useState(false);

  useEffect(() => {
    if (!token || hasAttemptedAutoConfirm) {
      return;
    }

    setHasAttemptedAutoConfirm(true);
    void confirmMutation
      .mutateAsync({ token })
      .then((response) => {
        showSuccessToast(
          "Email verified",
          "Your account is ready. Continue to login to enter your workspace.",
        );
        const loginTarget = buildLoginPath(response.email || email, response.redirectPath ?? nextPath);

        router.replace(loginTarget);
      })
      .catch((error) => {
        showApiErrorToast(
          error,
          "We couldn't verify that email link. You can request a fresh one below.",
        );
      });
  }, [
    confirmMutation,
    email,
    hasAttemptedAutoConfirm,
    nextPath,
    router,
    token,
  ]);

  async function handleResendVerification() {
    if (!email) {
      return;
    }

    try {
      const response = await resendMutation.mutateAsync({
        email,
        redirectPath: nextPath,
      });

      showSuccessToast("Verification email sent", response.message);
    } catch (error) {
      showApiErrorToast(
        error,
        "We couldn't resend the verification email right now.",
      );
    }
  }

  const isConfirming = confirmMutation.isPending;
  const isResending = resendMutation.isPending;
  const confirmedEmail = confirmMutation.data?.email ?? email;
  const hasConfirmError = confirmMutation.isError;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,rgba(44,62,255,0.05),transparent_28%),linear-gradient(135deg,rgba(28,46,190,0.08),transparent_52%),var(--background)] px-4 py-6">
      <section className="w-full max-w-md rounded-[8px] border border-border/70 bg-card px-5 py-7 shadow-[0_24px_80px_rgba(32,44,120,0.12)] sm:px-7 sm:py-8">
        <div className="mb-6 space-y-3 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            {isConfirming ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : hasConfirmError ? (
              <RefreshCcw className="size-5" />
            ) : confirmMutation.data ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <MailCheck className="size-5" />
            )}
          </div>
          <p className="text-[11px] font-semibold tracking-[0.26em] text-muted-foreground uppercase">
            Email verification
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isConfirming
              ? "Verifying your account"
              : confirmMutation.data
                ? "Your email is verified"
                : "Check your inbox"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {isConfirming
              ? "We're confirming your verification link now."
              : confirmMutation.data
                ? "You're ready to log in and continue into your workspace."
                : hasConfirmError
                  ? "That verification link could not be completed. Request a fresh email and try again."
                  : confirmedEmail
                    ? `We sent a verification link to ${confirmedEmail}. Use that email to finish account setup.`
                    : "Open the verification email we sent you to finish account setup."}
          </p>
        </div>

        <div className="space-y-3">
          {confirmedEmail ? (
            <div className="rounded-[8px] bg-muted/45 px-4 py-3 text-sm text-muted-foreground">
              Account email: <span className="font-medium text-foreground">{confirmedEmail}</span>
            </div>
          ) : null}

          {confirmMutation.data ? (
            <Button asChild size="lg" className="h-11 w-full rounded-[8px]">
              <Link href={buildLoginPath(confirmedEmail, confirmMutation.data.redirectPath ?? nextPath)}>
                Continue to login
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              type="button"
              disabled={!confirmedEmail || isConfirming || isResending}
              className="h-11 w-full rounded-[8px]"
              onClick={handleResendVerification}
            >
              {isResending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Sending verification email
                </>
              ) : (
                <>
                  <RefreshCcw className="size-4" />
                  Resend verification email
                </>
              )}
            </Button>
          )}

          <Button asChild variant="outline" className="h-11 w-full rounded-[8px]">
            <Link href={buildLoginPath(confirmedEmail, nextPath)}>Back to login</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function buildLoginPath(email: string | null, nextPath: string | null) {
  const params = new URLSearchParams();

  if (email) {
    params.set("email", email);
  }

  if (nextPath) {
    params.set("next", nextPath);
  }

  const queryString = params.toString();

  return (queryString ? `/login?${queryString}` : "/login") as Route;
}
