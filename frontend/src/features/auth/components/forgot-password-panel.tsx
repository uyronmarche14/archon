"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Link2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicAuthCard } from "@/features/auth/components/public-auth-card";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { validateEmailAddress } from "@/features/auth/lib/password-validation";
import { showApiErrorToast, showSuccessToast } from "@/lib/toast";
import { isApiClientError } from "@/services/http/api-client-error";

type ForgotPasswordFormErrors = {
  email?: string;
};

export function ForgotPasswordPanel() {
  const searchParams = useSearchParams();
  const forgotPasswordMutation = useForgotPassword();
  const initialEmail = useMemo(
    () => searchParams.get("email")?.trim().toLowerCase() ?? "",
    [searchParams],
  );
  const [email, setEmail] = useState(initialEmail);
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmailAddress(normalizedEmail);

    setFieldErrors(emailError ? { email: emailError } : {});
    setFormError(null);

    if (emailError) {
      return;
    }

    try {
      const response = await forgotPasswordMutation.mutateAsync({
        email: normalizedEmail,
      });

      setGeneratedResetLink(response.resetUrl);
      showSuccessToast("Reset ready", response.message);
    } catch (error) {
      setGeneratedResetLink(null);
      const message = isApiClientError(error)
        ? error.message
        : "Unable to start the password reset flow right now.";

      setFormError(message);
      showApiErrorToast(
        error,
        "Unable to start the password reset flow right now.",
      );
    }
  }

  return (
    <PublicAuthCard
      eyebrow="Recovery"
      title="Reset your password"
      description="Enter your email to generate an internal testing reset link on this no-email build."
      footerHref="/login"
      footerLabel="Remembered your password?"
      footerText="Back to login"
    >
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <Input
            placeholder="jane@example.com"
            type="email"
            autoComplete="email"
            className="h-11 rounded-[8px] border-border/80 bg-background px-4 shadow-none"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors({});
              setFormError(null);
            }}
          />
          {fieldErrors.email ? (
            <p className="text-xs text-destructive">{fieldErrors.email}</p>
          ) : null}
        </label>

        <div className="rounded-[8px] bg-muted/45 px-4 py-3 text-xs leading-6 text-muted-foreground">
          This route is internal-only on the current branch. In development and test environments,
          Archon reveals a one-time reset link directly instead of sending email.
        </div>

        {formError ? (
          <div className="rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        {generatedResetLink ? (
          <div className="space-y-3 rounded-[8px] border border-border/80 bg-background px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Link2 className="size-4 text-primary" />
              Internal reset link
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              Open this one-time link to continue the reset flow.
            </p>
            <Input
              value={generatedResetLink}
              readOnly
              className="h-11 rounded-[8px] border-border/80 bg-muted/35 px-4 shadow-none"
            />
            <Button asChild variant="outline" className="w-full rounded-[8px]">
              <a href={generatedResetLink}>Open reset page</a>
            </Button>
          </div>
        ) : null}

        <Button
          size="lg"
          type="submit"
          disabled={forgotPasswordMutation.isPending}
          className="mt-1.5 h-11 w-full rounded-[8px] text-sm font-semibold shadow-[0_12px_24px_rgba(53,64,209,0.22)]"
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Generating reset link
            </>
          ) : (
            <>
              Generate reset link
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </PublicAuthCard>
  );
}
