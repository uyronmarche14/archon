import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPanel } from "@/features/auth/components/reset-password-panel";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password after opening a one-time reset link.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPanel />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return <div className="min-h-screen bg-background" />;
}
