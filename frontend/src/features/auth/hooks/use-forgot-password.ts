"use client";

import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/features/auth/services/forgot-password";

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}
