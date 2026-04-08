"use client";

import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/features/auth/services/reset-password";

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}
