import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordPanel } from "@/features/auth/components/forgot-password-panel";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Generate an internal password reset link for the current no-email build.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordPanel />
    </Suspense>
  );
}

function ForgotPasswordFallback() {
  return <div className="min-h-screen bg-background" />;
}
