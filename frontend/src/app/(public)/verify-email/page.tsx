import type { Metadata } from "next";
import { EmailVerificationPanel } from "@/features/auth/components/email-verification-panel";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Confirm your Archon account email to finish setup and continue to login.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{
    email?: string | string[];
    token?: string | string[];
    next?: string | string[];
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <EmailVerificationPanel
      email={normalizeSingleValue(resolvedSearchParams?.email)}
      token={normalizeSingleValue(resolvedSearchParams?.token)}
      nextPath={normalizeNextPath(normalizeSingleValue(resolvedSearchParams?.next))}
    />
  );
}

function normalizeSingleValue(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim();

  return normalizedValue ? normalizedValue : null;
}

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}
